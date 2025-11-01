import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Phone Recommender",
  description: "AI-powered mobile comparison and recommendation tool",
};

// ✅ Simplified RootLayout using safe local system fonts (no network fetches)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-white text-gray-900"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
