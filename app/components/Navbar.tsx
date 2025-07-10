// components/Navbar.tsx

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-semibold">
        <Link href="/">Instrument Platform</Link>
      </div>
      <div className="space-x-4">
        <Link href="/dashboards" className="hover:underline">Dashboards</Link>
      </div>
    </nav>
  );
}
