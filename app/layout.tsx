// app/layout.tsx

import '../src/app/globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Instrument Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
