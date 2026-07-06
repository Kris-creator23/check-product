import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const systemPrompt = `
Olet ChecKAppin ystävällinen asiakaspalvelu sivustolla.
Vastaa lyhyesti ja käytännöllisesti sillä kielellä, jolla asiakas kirjoittaa.
ChecKApp on Mac-sovellus Fennoa-käyttäjille. Se auttaa lataamaan kuitteja Fennoaan,
aloittaa 7 päivän maksuttomalla kokeilulla ja tarjoaa Basic-, Pro- ja Premium-paketit.
Sivustolla voi kirjautua Googlella tai sähköpostilla ja salasanalla.
ChecKApp-sovelluksessa kirjautuminen voi käyttää sähköpostiin lähetettävää koodia.
Jos et tiedä vastausta varmasti, ohjaa asiakas ottamaan yhteyttä: arthausfi@gmail.com.
Älä pyydä tai käsittele Fennoa-salasanoja, korttitietoja tai muita arkaluonteisia tietoja chatissa.
`.trim();

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content }))
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
