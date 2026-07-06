import type { Metadata } from "next";
import { LegalFooter } from "./components/LegalFooter";
import { SupportChat } from "./components/SupportChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheckApp | Kuittien automaatio Fennoaan",
  description: "CheckApp vie kuitit valitusta kansiosta Fennoaan automaattisesti.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>
        {children}
        <LegalFooter />
        <SupportChat />
      </body>
    </html>
  );
}
