import './globals.css';
import type { Metadata } from 'next';
import { Inter, Teko } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const teko = Teko({ subsets: ['latin'], variable: '--font-teko' });

export const metadata: Metadata = {
  title: 'The Genesis',
  description: 'The Genesis — real-time futsal auction platform.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${teko.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
