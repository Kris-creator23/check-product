import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getPlan, type PlanId } from "../../../lib/plans";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_JSON_BYTES = 7 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);
const ALLOWED_FIELDS = new Set(["imageBase64", "mimeType"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

type RateLimitBucket = {
  startedAt: number;
  count: number;
};

const rateLimits = new Map<string, RateLimitBucket>();

const receiptSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    supplier_name: { type: "string" },
    country: { type: "string" },
    business_id: { type: "string" },
    vat_number: { type: "string" },
    invoice_number: { type: "string" },
    invoice_date: { type: "string" },
    entry_date: { type: "string" },
    due_date: { type: "string" },
    total_gross: { type: "number" },
    total_net: { type: "number" },
    vat_amount: { type: "number" },
    currency: { type: "string" },
    expense_type: { type: "string" },
    note: { type: "string" }
  },
  required: [
    "supplier_name",
    "country",
    "business_id",
    "vat_number",
    "invoice_number",
    "invoice_date",
    "entry_date",
    "due_date",
    "total_gross",
    "total_net",
    "vat_amount",
    "currency",
    "expense_type",
    "note"
  ]
};

function safeError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function checkRateLimit(userId: string) {
  const now = Date.now();
  const bucket = rateLimits.get(userId);

  if (!bucket || now - bucket.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(userId, { startedAt: now, count: 1 });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  bucket.count += 1;
  return true;
}

function isBase64(value: string) {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeReceiptData(value: unknown) {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const totalGross = normalizeNumber(data.total_gross);
  const vatAmount = normalizeNumber(data.vat_amount);
  const totalNet = normalizeNumber(data.total_net) || (totalGross && vatAmount ? Math.round((totalGross - vatAmount) * 100) / 100 : 0);

  return {
    supplier_name: normalizeString(data.supplier_name),
    country: normalizeString(data.country),
    business_id: normalizeString(data.business_id),
    vat_number: normalizeString(data.vat_number),
    invoice_number: normalizeString(data.invoice_number),
    invoice_date: normalizeString(data.invoice_date),
    entry_date: normalizeString(data.entry_date),
    due_date: normalizeString(data.due_date),
    total_gross: totalGross,
    total_net: totalNet,
    vat_amount: vatAmount,
    currency: normalizeString(data.currency) || "EUR",
    expense_type: normalizeString(data.expense_type),
    note: normalizeString(data.note)
  };
}

function getOutputText(data: Record<string, any>) {
  if (typeof data.output_text === "string") return data.output_text;
  return data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
    .map((content: { text?: string }) => content.text)
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return safeError("OpenAI API key is missing in production", 503);

  const auth = await requireUser(request);
  if ("error" in auth) return safeError("authentication required", 401);

  if (!checkRateLimit(auth.user.id)) {
    return safeError("recognition rate limit reached, try again in a minute", 429);
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("selected_plan, trial_ends_at, subscription_status, receipts_used")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) return safeError("subscription lookup failed", 503);
  if (!profile) return safeError("subscription inactive", 403);

  const selectedPlan = profile.selected_plan as PlanId | null;
  const plan = selectedPlan ? getPlan(selectedPlan) : null;
  const trialActive = profile.trial_ends_at ? new Date(profile.trial_ends_at).getTime() > Date.now() : false;
  const paidActive = ["active", "trialing"].includes(profile.subscription_status ?? "");
  const quota = plan?.quota ?? 0;
  const receiptsUsed = profile.receipts_used ?? 0;

  if (!trialActive && !paidActive) return safeError("subscription inactive", 403);
  if (receiptsUsed >= quota) return safeError("usage limit reached", 403);

  const bodyText = await request.text();
  if (Buffer.byteLength(bodyText, "utf8") > MAX_JSON_BYTES) {
    return safeError("file too large", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return safeError("recognition failed", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return safeError("recognition failed", 400);
  }

  const payload = body as Record<string, unknown>;
  if (Object.keys(payload).some((field) => !ALLOWED_FIELDS.has(field))) {
    return safeError("recognition failed", 400);
  }

  const imageBase64 = typeof payload.imageBase64 === "string" ? payload.imageBase64 : "";
  const mimeType = typeof payload.mimeType === "string" ? payload.mimeType : "";

  if (!ALLOWED_MIME_TYPES.has(mimeType)) return safeError("unsupported file", 415);
  if (!imageBase64 || !isBase64(imageBase64)) return safeError("recognition failed", 400);

  const imageBytes = Buffer.byteLength(imageBase64, "base64");
  if (imageBytes <= 0 || imageBytes > MAX_IMAGE_BYTES) {
    return safeError("file too large", 413);
  }

const prompt = `
Read the receipt or invoice image and return only structured data.
Use empty strings for missing text values and 0 for missing numeric values.
Never copy the receipt date into supplier_name, vat_number, business_id, invoice_number, expense_type or note. If a field is not clearly visible, return an empty string for that field.
Dates must use D.M.YYYY format when visible. If a receipt date is printed as DD.MM.YY, convert it to D.M.20YY.
invoice_date and entry_date must be the actual purchase/receipt date from the receipt, not today's date.
If the receipt date is not clearly visible, use an empty string. Never infer or use the current date.
country must be the supplier country in English, for example "Finland" or "Estonia", not "Suomi". Do not assume Finland for foreign receipts.
vat_number must be an actual VAT number such as FI12345678 or EE123456789. business_id must be a Finnish Y-tunnus only; for foreign suppliers use an empty string.
expense_type must be a short Finnish accounting-style expense description, for example "polttoainekulut", "laitteiden hankinta", "työvaatteet ja suojavarusteet", "toimistotarvikkeet", "pienhankinnat" or "muut ostot".
expense_type must describe the purchase purpose, not the store number, branch, cashier, receipt type or payment method.
note must not contain cashier names, payment card text, timestamps or long raw receipt text. Use note only for a short useful clarification, otherwise an empty string.
Do not include explanations.
`.trim();

  let openaiResponse: Response;
  try {
    openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(25_000),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECEIPT_MODEL ?? "gpt-5.4-mini",
        store: false,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: `data:${mimeType};base64,${imageBase64}` }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt_recognition",
            schema: receiptSchema,
            strict: true
          }
        }
      })
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    if (errorName === "TimeoutError" || errorName === "AbortError") {
      return safeError("OpenAI request timed out", 503);
    }
    return safeError("OpenAI request failed", 503);
  }

  if (!openaiResponse.ok) {
    return safeError("recognition service rejected image", 502);
  }

  try {
    const result = await openaiResponse.json();
    const outputText = getOutputText(result);
    const parsed = JSON.parse(outputText);

    return NextResponse.json({
      data: normalizeReceiptData(parsed)
    });
  } catch {
    return safeError("recognition response could not be parsed", 502);
  }
}
