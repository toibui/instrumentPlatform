'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl w-full text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
          <Link href="/" className="hover:underline">
            🎛️ Instrument Platform
          </Link>
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Welcome to the platform for monitoring and analyzing instrument data.
        </p>
        <Link
          href="/dashboards"
          className="inline-block bg-blue-600 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-700 transition"
        >
          View Dashboards →
        </Link>
      </div>
    </div>
  );
}
