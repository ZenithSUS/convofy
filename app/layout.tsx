import "@/styles/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Providers from "@/components/providers/provider-wrapper";
import getUserTheme from "@/lib/get-user-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://convofy-sand.vercel.app"),
  title: {
    default: "Convofy – Smart & Fast Conversations",
    template: "%s | Convofy",
  },
  description:
    "Convofy is a modern platform to manage, share, and organize your conversations effortlessly with real-time messaging and communication.",
  keywords: [
    "Convofy",
    "chat app",
    "messaging app",
    "real-time chat",
    "Next.js chat app",
    "Pusher chat",
  ],
  authors: [{ name: "Convofy Team" }],
  creator: "Convofy",
  publisher: "Convofy",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "https://convofy-sand.vercel.app",
  },

  icons: {
    icon: "/convofy.png",
    apple: "/convofy.png",
    shortcut: "/convofy.png",
  },

  openGraph: {
    type: "website",
    url: "https://convofy-sand.vercel.app",
    title: "Convofy – Manage & Share Your Conversations Easily",
    description:
      "A clean and modern platform to organize, manage, and share conversations effortlessly.",
    siteName: "Convofy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Convofy App Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Convofy – Smart & Fast Conversations",
    description:
      "A clean and modern platform to organize, manage, and share conversations effortlessly.",
    images: ["/og-image.png"],
    creator: "@ZenithSUS",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getUserTheme();
  return (
    <html lang="en" className={`${theme} scroll-smooth`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
