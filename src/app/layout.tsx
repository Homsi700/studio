import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a modern feel
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider
import { ThemeProvider } from '@/components/dashboard/ThemeProvider'; // Import ThemeProvider for dark/light mode persistence

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Network Pilot', // Updated title
  description: 'Unified management for Mikrotik, Mimosa, and UBNT devices.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AuthProvider>
              <main>{children}</main>
              <Toaster /> {/* Add Toaster component here */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
