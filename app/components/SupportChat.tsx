"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Hei! Olen CheckAppin asiakaspalvelu. Miten voin auttaa?"
};

const customGptUrl = "https://chatgpt.com/g/g-6a4b5f56ca508191a7627398a5d79fbc-asiakaspalvelu";
const blockedSecretPattern = /(salasana|password|2fa|kaksivaihe|authenticator|kortti|card|cvv|cvc|\b\d{13,19}\b)/i;

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || busy) return;

    if (blockedSecretPattern.test(text)) {
      setMessages([
        ...messages,
        {
          role: "assistant",
          content: "Älä lähetä salasanoja, 2FA-koodeja, maksukorttitietoja tai muita salaisuuksia chatissa."
        }
      ]);
      setInput("");
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) })
      });
      const data = await response.json();
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: response.ok ? data.message : data.error ?? "Vastaaminen epäonnistui."
        }
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Yhteys asiakaspalveluun epäonnistui. Yritä hetken päästä uudelleen." }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`supportChat ${open ? "open" : ""}`}>
      {open && (
        <section className="supportPanel" aria-label="CheckApp asiakaspalvelu">
          <div className="supportHeader">
            <div>
              <b>Asiakaspalvelu</b>
              <span>CheckApp-tuki</span>
            </div>
            <div className="supportHeaderActions">
              <a href={customGptUrl} target="_blank" rel="noreferrer">Avaa asiakaspalvelu</a>
              <button type="button" onClick={() => setOpen(false)} aria-label="Sulje asiakaspalvelu">×</button>
            </div>
          </div>
          <div className="supportMessages">
            {messages.map((message, index) => (
              <p className={`supportBubble ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </p>
            ))}
            {busy && <p className="supportBubble assistant">Kirjoitetaan...</p>}
          </div>
          <p className="supportNotice">
            Älä lähetä Fennoa-salasanoja, 2FA-koodeja, maksukorttitietoja tai tarpeettomia kuittikuvia. Chat-viestejä voidaan käsitellä asiakaspalvelun tuottamiseksi.
          </p>
          <form
            className="supportForm"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Kirjoita viesti..."
              aria-label="Viesti asiakaspalvelulle"
            />
            <button type="submit" disabled={busy || !input.trim()}>Lähetä</button>
          </form>
        </section>
      )}
      <button className="supportToggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">?</span>
        Asiakaspalvelu
      </button>
    </div>
  );
}
