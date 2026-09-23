import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/components/shared/session-provider";
import { Navbar } from "@/components/shared/navbar";
import { AmbientBackground } from "@/components/shared/ambient-background";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

// Dark is the default experience; this runs before paint so switching to
// light mode (persisted from a prior visit) never causes a flash of the
// wrong theme.
const noFlashThemeScript = `
try {
  var theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen font-sans antialiased`}>
        <AmbientBackground />
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
