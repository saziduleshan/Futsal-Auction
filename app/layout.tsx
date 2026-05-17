import './globals.css';
import type { Metadata } from 'next';
import { Inter, Teko } from 'next/font/google';
import { SiteShell } from '@/components/layout/site-shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const teko = Teko({ subsets: ['latin'], variable: '--font-teko' });

export const metadata: Metadata = {
  title: 'Joga Bonito 2026',
  description: 'A vibrant, real-time auction platform for men and women futsal tournaments — powered by Joga Bonito spirit.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${teko.variable}`}>
      <body className="font-sans">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
