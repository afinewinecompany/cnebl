import type { Metadata } from "next";
import { Oswald, Source_Serif_4, IBM_Plex_Mono, Pacifico } from "next/font/google";
import { SessionProvider } from "@/components/providers";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CNEBL - Coastal New England Baseball League",
  description: "Home of the Coastal New England Baseball League. View schedules, standings, statistics, and connect with your team.",
  keywords: ["baseball", "league", "New England", "adult baseball", "CNEBL"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} ${pacifico.variable}`}
    >
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
