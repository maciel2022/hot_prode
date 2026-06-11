import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "HOT PRODE 2026",
  description:
    "Make your World Cup 2026 predictions. Compete with colleagues, follow the results and prove you know football.",
  keywords: ["World Cup 2026", "predictions", "football", "soccer", "Hot Prode", "HotChilliDevs"],
  openGraph: {
    title: "HOT PRODE 2026",
    description: "Predecí los resultados del Mundial 2026. Competí con amigos y demostrá que sabés de fútbol.",
    siteName: "HOT PRODE 2026",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "HOT PRODE 2026",
    description: "Predecí los resultados del Mundial 2026. Competí con amigos y demostrá que sabés de fútbol.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark h-full">
      <body className="min-h-full flex flex-col bg-background text-on-surface antialiased overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
