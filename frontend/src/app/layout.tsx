import type { Metadata } from "next";
import { Outfit, DM_Sans, VT323, Press_Start_2P } from "next/font/google";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Billet",
  description:
    "Platform tiket acara terdesentralisasi di Base L2. Beli, jual, dan kelola tiket dengan aman — tanpa calo, harga adil, check-in instan.",
  keywords: ["tiket", "blockchain", "NFT", "Base", "decentralized", "IDRX", "event"],
  openGraph: {
    title: "Billet",
    description: "Beli tiket acara di blockchain tanpa calo. Harga adil, check-in instan.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${dmSans.variable} ${vt323.variable} ${pressStart2P.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Web3Provider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(26,22,18,0.08)",
                color: "#1A1612",
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
