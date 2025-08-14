import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gabarita AI - Preparação para Concursos',
  description: 'Plataforma inteligente para preparação em concursos públicos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}