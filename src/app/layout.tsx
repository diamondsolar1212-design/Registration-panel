import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";

const geistSans = localFont({
  src: [
    { path: "../../public/fonts/geist-latin.woff2", weight: "100 900" },
    { path: "../../public/fonts/geist-latin-ext.woff2", weight: "100 900" },
  ],
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: [
    { path: "../../public/fonts/geist-mono-latin.woff2", weight: "100 900" },
    { path: "../../public/fonts/geist-mono-latin-ext.woff2", weight: "100 900" },
  ],
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export const metadata: Metadata = {
  title: "Diamond Solar - Powering India's Solar Future",
  description:
    "Diamond Solar brings clean, affordable solar energy to homes and businesses across India. Apply for solar installation, track your application, and start saving with renewable energy.",
  keywords: [
    "solar energy",
    "solar panels",
    "India solar",
    "renewable energy",
    "solar installation",
    "Diamond Solar",
    "clean energy",
    "solar subsidy",
  ],
  authors: [{ name: "Diamond Solar" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Diamond Solar - Powering India's Solar Future",
    description:
      "Clean, affordable solar energy for homes and businesses across India. Apply today and start saving.",
    type: "website",
    siteName: "Diamond Solar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diamond Solar - Powering India's Solar Future",
    description:
      "Clean, affordable solar energy for homes and businesses across India.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Diamond Solar",
  },
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Diamond Solar" />
        <meta name="application-name" content="Diamond Solar" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="msapplication-navbutton-color" content="#f59e0b" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overscroll-none`}
      >
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <div className="hidden md:block">
            <Footer />
          </div>
        </div>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
