import RawDataTableClient from './RawDataTableClient';

export default function RawDataPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Parameter list by instrument</h1>
      <RawDataTableClient />
    </div>
  );
}