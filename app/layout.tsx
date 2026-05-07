import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liber",
  description: "Track your reading with a Strava-inspired mobile MVP.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
