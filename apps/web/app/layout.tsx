import type { Metadata } from 'next';
import '../styles/globals.css';
export const metadata: Metadata = {
  title: 'FinanceOS — Gestão Financeira Pessoal',
  description: 'Plataforma de gestão financeira com design Liquid Glass',
  icons: { icon: '/favicon.ico' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
