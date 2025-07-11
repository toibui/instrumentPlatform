'use client';

import dynamic from 'next/dynamic';

// Load client component only on the client
const RawDataTableClient = dynamic(() => import('./DataTableClient'), {
  ssr: false,
});

export default function RawDataPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reagent list by instrument</h1>
      <RawDataTableClient />
    </div>
  );
}
