import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/auth-context';

export const metadata: Metadata = {
  title: 'Zentra | Multi-tenant HRMS Platform',
  description: 'Zentra - Unified HR & Workforce Identity Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F6F8FB] text-[#0F172A] min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
