import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SoundGravity",
  description: "Experience audio in a new dimension.",
  openGraph: {
    title: "SoundGravity",
    description: "Experience audio in a new dimension.",
    url: "https://sound-gravity.vercel.app",
    siteName: "SoundGravity",
    images: [
      {
        url: "/og_logo.png",
        width: 1200, // Standard OG size, though image might differ, Next.js handles it or browser scales
        height: 630,
        alt: "SoundGravity Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundGravity",
    description: "Experience audio in a new dimension.",
    images: ["/og_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
