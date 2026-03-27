import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Creative Intelligence | Grupo UP",
  description: "Dashboard de inteligência criativa para Meta Ads - Performance marketing para marcas de moda",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
