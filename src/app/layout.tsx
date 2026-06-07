import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { CronInitializer } from '@/components/cron-initializer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Financial Portfolio Manager',
  description: 'Manage your financial portfolio with real-time data',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="bg-background text-foreground">
        <CronInitializer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}