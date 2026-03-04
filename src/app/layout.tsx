import type { Metadata } from "next";
import { Bodoni_Moda, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const serif = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif"
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Galaxy Graphics",
  description: "Art + function focused licensing gallery for modern business use."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} bg-bg text-text-main antialiased`}>
        {children}
      </body>
    </html>
  );
}
