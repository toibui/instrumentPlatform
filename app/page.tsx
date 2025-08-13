'use client';

import Link from 'next/link';
import { FlaskConical } from 'lucide-react'; // npm install lucide-react

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-10 max-w-xl w-full text-center border border-white/40">
        
        {/* Logo / Title */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <FlaskConical size={42} className="text-blue-600 drop-shadow" />
          <h1 className="text-5xl font-extrabold text-gray-800 drop-shadow-sm">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Instrument Platform
            </Link>
          </h1>
        </div>
        
        {/* Subtitle */}
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Chào mừng bạn đến với <span className="font-semibold text-blue-700">nền tảng quản lý hóa chất</span> theo máy xét nghiệm!
        </p>
        
        {/* Call to Action */}
        <Link
          href="/reagenttest"
          className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          🚀 Bắt đầu ngay
        </Link>
      </div>
    </div>
  );
}
