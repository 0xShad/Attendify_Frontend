import type { Metadata } from "next";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__ENV__ = {
                NEXT_PUBLIC_AUTH_API_URL: "${process.env.NEXT_PUBLIC_AUTH_API_URL}",
                NEXT_PUBLIC_USER_API_URL: "${process.env.NEXT_PUBLIC_USER_API_URL}",
                NEXT_PUBLIC_BACKEND_API_URL: "${process.env.NEXT_PUBLIC_BACKEND_API_URL}",
                NEXT_PUBLIC_APP_URL: "${process.env.NEXT_PUBLIC_APP_URL}",
              };
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
