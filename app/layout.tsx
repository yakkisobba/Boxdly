import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'unboxd',
  description: 'Your Letterboxd diary, unwrapped.',
   icons: {
    icon: '/ic_unboxd.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
