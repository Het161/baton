import type { Metadata, Viewport } from "next";
import { fontClassNames } from "./fonts";
import { EnvironmentProvider } from "@/components/providers/Environment";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { SITE_URL as SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "BATON — your phone captures, thinks, and hands off",
    template: "%s — BATON",
  },
  description:
    "BATON captures on your phone, runs a local model on-device to summarise and extract the work, then hands the finished artifact to your desk. Zero bytes to the cloud. Built for the iQOO Hackathon 2026, Chennai Battle.",
  applicationName: "BATON",
  keywords: [
    "on-device AI",
    "LiteRT-LM",
    "Gemma 3n",
    "Office Kit",
    "OriginOS 6",
    "iQOO 15",
    "phone-first",
    "offline AI",
    "iQOO Hackathon 2026",
  ],
  authors: [{ name: "Team BATON" }],
  creator: "Team BATON",
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "BATON",
    title: "BATON — your phone captures, thinks, and hands off",
    description:
      "A local model runs on the phone. The finished work rides the Office Kit flow to your desk. 0 bytes to the cloud.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "BATON — your phone captures, thinks, and hands off",
    description:
      "A local model runs on the phone. The finished work rides the Office Kit flow to your desk. 0 bytes to the cloud.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#0B0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontClassNames}>
      <body>
        <EnvironmentProvider>
          <SmoothScroll />
          {children}
        </EnvironmentProvider>
      </body>
    </html>
  );
}
