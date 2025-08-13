import RawDataTableClient from './RawDataTableClient';

export default function RawDataPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hóa chất theo xét nghiệm</h1>
      <RawDataTableClient />
    </div>
  );
}