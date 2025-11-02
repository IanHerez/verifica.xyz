import type React from "react"
import type { Metadata } from "next"
import { Work_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "./providers"
import "./globals.css"

const workSans = Work_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "verifica.xyz - Transparencia Institucional",
  description: "Documentos oficiales públicos verificables con blockchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${workSans.className} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
