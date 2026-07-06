import { NextResponse } from "next/server";
import { siteContent } from "../../../lib/siteContent";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const blockedSecretPattern = /(salasana|password|2fa|kaksivaihe|authenticator|kortti|card|cvv|cvc|\b\d{13,19}\b)/i;
const cardLikePattern = /\b\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d[ -]*\d(?:[ -]*\d){0,6}\b/g;
const credentialPattern = /(salasana|password|2fa|cvv|cvc)\s*[:=]\s*\S+/gi;

const systemPrompt = `
Olet CheckAppin ystävällinen asiakaspalvelu sivustolla.
Vastaa lyhyesti ja käytännöllisesti sillä kielellä, jolla asiakas kirjoittaa.
CheckApp on Mac-sovellus Fennoa-käyttäjille. Se auttaa lataamaan kuitteja Fennoaan,
aloittaa 7 päivän maksuttomalla kokeilulla ja tarjoaa Basic-, Pro- ja Premium-paketit.
Sivustolla voi kirjautua Googlella tai sähköpostilla ja salasanalla.
CheckApp-sovelluksessa kirjautuminen voi käyttää sähköpostiin lähetettävää koodia.
Kuittien tunnistuksessa kuittikuva lähetetään OpenAI API:lle CheckAppin backend-välityspalvelun kautta. CheckAppin backend käsittelee
tili-, tilaus-, lisenssi- ja käyttömäärätietoja, ei kuitin alkuperäistä tiedostoa.
Jos et tiedä vastausta varmasti, ohjaa asiakas ottamaan yhteyttä: ${siteContent.supportEmail}.
Älä pyydä tai käsittele Fennoa-salasanoja, korttitietoja tai muita arkaluonteisia tietoja chatissa.
`.trim();

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
}

function sanitizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    content: message.content
      .replace(cardLikePattern, "[redacted]")
      .replace(credentialPattern, "$1: [redacted]")
      .slice(0, 2000)
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Asiakaspalvelu ei ole vielä käytössä." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const rawMessages: unknown[] =
    body && typeof body === "object" && Array.isArray((body as { messages?: unknown }).messages)
      ? (body as { messages: unknown[] }).messages
      : [];
  const messages: ChatMessage[] = rawMessages.filter(isChatMessage).slice(-12);
  const userInput = messages.filter((message) => message.role === "user").at(-1)?.content.trim();

  if (!userInput) {
    return NextResponse.json({ error: "Kirjoita viesti ensin." }, { status: 400 });
  }

  if (blockedSecretPattern.test(userInput)) {
    return NextResponse.json({
      error: "Älä lähetä salasanoja, 2FA-koodeja, maksukorttitietoja tai muita salaisuuksia chatissa."
    }, { status: 400 });
  }

  const safeMessages = messages.map(sanitizeMessage);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      store: false,
      input: [
        { role: "system", content: systemPrompt },
        ...safeMessages.map((message) => ({ role: message.role, content: message.content }))
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: "Asiakaspalvelu ei vastaa juuri nyt." }, { status: 502 });
  }

  const outputText =
    typeof data.output_text === "string"
      ? data.output_text
      : data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
          .map((content: { text?: string }) => content.text)
          .filter(Boolean)
          .join("\n");

  return NextResponse.json({
    message: outputText || "En saanut vastausta. Yritä hetken päästä uudelleen."
  });
}
