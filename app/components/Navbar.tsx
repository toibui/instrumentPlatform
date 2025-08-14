'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react'; // npm install lucide-react

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/reagInstruments', label: 'Hóa chất theo máy' },
    { href: '/reagenttest', label: 'Hóa chất theo xét nghiệm' },
    { href: '/waitingpage', label: 'Hóa chất chuyển đổi AMS, Biotin, FLIRT, ESPS' },
    { href: '/waitingpage', label: 'Chuyển đổi danh mục' }
  ];

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      {/* Logo */}
      <div className="text-2xl font-bold tracking-wide hover:text-blue-400 transition-colors">
        <Link href="/">Instrument Platform</Link>
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none"
        >
          Tùy chọn giao diện
          <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-lg shadow-xl overflow-hidden z-50 animate-fadeIn">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 hover:bg-gray-100 transition-colors text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}
