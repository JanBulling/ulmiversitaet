import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { fontSans } from "@/lib/fonts";
import messages from "@/lib/i18n/messages/de.json";

// Rendered for URLs that match no route at all (outside `[locale]`), so no i18n context exists
export const metadata: Metadata = {
  title: messages.NotFound.title,
};

export default function GlobalNotFound() {
  return (
    <html lang="de">
      <body
        className={`${fontSans.variable} flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 text-center font-sans text-foreground antialiased`}
      >
        <h1 className="text-3xl font-semibold">{messages.NotFound.title}</h1>
        <p className="max-w-md text-muted-foreground">
          {messages.NotFound.description}
        </p>
        <Link href="/" className="underline underline-offset-4">
          {messages.NotFound.backHome}
        </Link>
      </body>
    </html>
  );
}
