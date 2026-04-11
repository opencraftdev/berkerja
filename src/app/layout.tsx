import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Berkerja - Job Aggregation',
  description: 'Automated job aggregation system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
