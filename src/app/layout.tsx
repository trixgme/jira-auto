import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";

export const metadata: Metadata = {
  title: "Jira Dashboard",
  description: "Jira Cloud 대시보드 - 새로운 이슈와 완료된 이슈 보기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          defaultTheme="system"
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
