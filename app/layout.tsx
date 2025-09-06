import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  initialScale: 1,
  width: "device-width",
};

export const metadata = {
  title: "Student Notice Board",
  description: "A real-time notice board and chat application for students",
  keywords: "student, notice board, chat, university, announcements",
  authors: [{ name: "Your Name" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased `}>
        <div className="bg-gray-50">{children}</div>
      </body>
    </html>
  );
}
