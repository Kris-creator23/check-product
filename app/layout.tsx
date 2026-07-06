import type { Metadata } from "next";
import { SupportChat } from "./components/SupportChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChecKApp | Kuittien automaatio Fennoaan",
  description: "ChecKApp vie kuitit valitusta kansiosta Fennoaan automaattisesti.",
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
        <SupportChat />
      </body>
    </html>
  );
}
