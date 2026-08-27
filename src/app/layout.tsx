import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sistem Manajemen Bengkel",
    template: "%s | Bengkel",
  },
  description:
    "Aplikasi manajemen bengkel motor multi-cabang. Pencatatan transaksi, monitoring, dan laporan otomatis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
