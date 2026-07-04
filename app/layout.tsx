import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Check | Kuittien automaatio Fennoaan",
  description: "Check vie kuitit valitusta kansiosta Fennoaan automaattisesti."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
