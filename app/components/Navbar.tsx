'use client'; // Chỉ cần nếu bạn dùng Next.js 13+ với app router

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center relative">
      <div className="text-xl font-semibold">
        <Link href="/">Instrument Platform</Link>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hover:underline focus:outline-none"
        >
          Export excel
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-md shadow-lg z-50">
            <Link
              href="/dashboards"
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Parameter by instrument
            </Link>
            <Link
              href="/reagInstruments"
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Reagent by instrument
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
