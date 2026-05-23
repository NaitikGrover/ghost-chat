import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Adyber | Anonymous & Encrypted",
  description: "A real-time anonymous chat platform with ephemeral rooms. Built by NaitikGrover.",
};

import { UserProvider } from "@/context/UserContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black overflow-hidden">
        <UserProvider>
          {/* Background Video */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-50"
            >
              <source src="/assets/universe.mp4" type="video/mp4" />
            </video>
            {/* Gradients and Overlays for a premium look */}
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60" />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {children}
        </UserProvider>
      </body>
    </html>
  );
}
