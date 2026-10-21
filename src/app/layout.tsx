import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daylight — A moment, for a day.",
  description: "A little space for life's everyday moments. Create image stories that disappear after 24 hours. Private, simple, and stored only on your device.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f7f8f3" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
