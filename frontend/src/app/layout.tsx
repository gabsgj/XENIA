import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import WakeBackend from "@/components/WakeBackend";

export const metadata: Metadata = {
  title: "XENIA - AI Study Planner",
  description: "Your personal AI-powered study planner and tutor. Generate personalized study plans, get help from AI tutors, and track your progress with powerful analytics.",
  keywords: ["AI", "study planner", "education", "tutoring", "learning", "analytics"],
  authors: [{ name: "XENIA Team" }],
  icons: {
    // Prefer the PNG logo for modern browsers, keep /favicon.ico as fallback
    icon: ['/logo.png', '/favicon.ico'],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <WakeBackend />
            {children}
            <Toaster richColors position="top-right" closeButton />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
