import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PlaylistPlayerProvider } from '@/contexts/PlaylistPlayerContext'
import GlobalAudioEngine from '@/components/GlobalAudioEngine'
import MobilePortraitLock from '@/components/ui/MobilePortraitLock'
import ServiceWorkerUnregister from '@/components/ServiceWorkerUnregister'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "SoundGravity",
  description: "Experience audio in a new dimension.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/logo-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SoundGravity",
    description: "Experience audio in a new dimension.",
    url: "https://sound-gravity.vercel.app",
    siteName: "SoundGravity",
    locale: "en_US",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SoundGravity",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundGravity",
    description: "Experience audio in a new dimension.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import NextTopLoader from 'nextjs-toploader'
import QueryProvider from '@/providers/QueryProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" sizes="180x180" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <PlaylistPlayerProvider>
            <NextTopLoader
              color="#ffffff"
              initialPosition={0.08}
              crawlSpeed={200}
              height={2}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px #ffffff,0 0 5px #ffffff"
            />
            <MobilePortraitLock />
            <ServiceWorkerUnregister />
            <GlobalAudioEngine />
            {children}
          </PlaylistPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
