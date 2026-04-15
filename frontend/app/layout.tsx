import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair', weight: ['700', '800', '900'] });

export const metadata: Metadata = {
  title: "IdentiFi — Identity-Powered Lending",
  description: "Your KYC level is your credit score. Borrow more with less collateral on HashKey Chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${inter.className} bg-[#f9fef5] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
