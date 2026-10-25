import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n-context";
import { LocationProvider } from "@/lib/location-context";

export const metadata: Metadata = {
  title: "Nirvana — Hyperlocal Climate Risk Alerts",
  description: "Localized flood and heat risk alerts for vulnerable urban communities. Know your neighbourhood risk, find nearest shelters, and get actionable safety guidance in your language.",
  keywords: ["flood alert", "heat warning", "climate risk", "neighbourhood safety", "Hyderabad", "urban resilience"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#0D9488" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="bg-cream-100 text-ink antialiased">
        <AuthProvider>
          <I18nProvider>
            <LocationProvider>
              {children}
            </LocationProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
