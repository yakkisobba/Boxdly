import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unboxd — Your Letterboxd Stats',
  description: 'Beautiful stats and insights from your Letterboxd diary.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
