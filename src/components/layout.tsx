import React, { Suspense } from "react"
import "./globals.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  )
}
