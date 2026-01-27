import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PlaylistPlayerProvider } from '@/contexts/PlaylistPlayerContext'
import GlobalAudioEngine from '@/components/GlobalAudioEngine'
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

import BottomPlayerBar from '@/components/ui/BottomPlayerBar'
import NextTopLoader from 'nextjs-toploader'
import QueryProvider from '@/providers/QueryProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            <GlobalAudioEngine />
            <BottomPlayerBar />
            {children}
          </PlaylistPlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
