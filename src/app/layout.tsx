import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Split the Bill",
  description: "Split bills among friends during trips",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
