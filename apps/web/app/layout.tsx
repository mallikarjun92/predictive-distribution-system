import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Predictive Distribution System | Low-Cost Agency Distribution Engine',
  description: 'AI-augmented, high-deliverability client acquisition platform for software services agencies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-brand-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
