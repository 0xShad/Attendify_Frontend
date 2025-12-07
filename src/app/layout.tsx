import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Attendify",
  description: "Facial Recognition Attendance System",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#1e9df1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Attendify Admin",
  },
  icons: {
    icon: '/logo_blue.png',
    shortcut: '/logo_blue.png',
    apple: '/logo_blue.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Explicit favicon links to cover cases where browsers prefer link tags over metadata */}
        <link rel="icon" href="/logo_blue.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/logo_blue.png" />
        <link rel="apple-touch-icon" href="/logo_blue.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Use next/script with strategy beforeInteractive so env is available as early as possible */}
        <Script id="env" strategy="beforeInteractive">
          {`window.__ENV__ = {
              NEXT_PUBLIC_AUTH_API_URL: "${process.env.NEXT_PUBLIC_AUTH_API_URL}",
              NEXT_PUBLIC_USER_API_URL: "${process.env.NEXT_PUBLIC_USER_API_URL}",
              NEXT_PUBLIC_BACKEND_API_URL: "${process.env.NEXT_PUBLIC_BACKEND_API_URL}",
              NEXT_PUBLIC_APP_URL: "${process.env.NEXT_PUBLIC_APP_URL}",
            };
            console.log('📍 [LAYOUT] Environment injected:', window.__ENV__);
          `}
        </Script>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
