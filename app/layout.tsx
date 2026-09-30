import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://daymark.mitemshub.com"),
  title: {
    default: "Daymark: Date & Week Calculator + Co-op Reference",
    template: "%s · Daymark",
  },
  description:
    "Calculate date ranges in inclusive/exclusive days, weeks and months, track the year with a descending week countdown, and keep investment series and member grade limits at hand.",
  keywords: [
    "date calculator",
    "week calculator",
    "days between dates",
    "week number",
    "investment series",
    "member grades",
  ],
  openGraph: {
    title: "Daymark: Date & Week Calculator",
    description:
      "Inclusive/exclusive day counts, a descending week countdown, and private reference tables for investment series and member grades.",
    type: "website",
    siteName: "Daymark",
  },
  twitter: {
    card: "summary",
    title: "Daymark: Date & Week Calculator",
    description:
      "Inclusive/exclusive day counts, a descending week countdown, and private reference tables.",
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  appleWebApp: {
    capable: true,
    title: "Daymark",
    statusBarStyle: "default",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-stamp focus:text-white focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
          {children}
        </main>
        <Footer />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
