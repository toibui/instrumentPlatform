'use client';

import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface RawData {
  InstrumentName: string | null;
  [key: string]: string | number | null;
}

export default function RawDataTableClient() {
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [instrumentNames, setInstrumentNames] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<RawData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    params.set('page', page.toString());

    const res = await fetch(`/api/reagInstruments?${params.toString()}`);
    const json = await res.json();

    // Nếu json là mảng trực tiếp thì dùng luôn
    const data = Array.isArray(json) ? json : json.data || [];
    const totalItems = Array.isArray(json) ? json : json.total || [];

    setRows(data);
    setTotal(totalItems);
    setLoading(false);
    }, [selectedInstruments, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchInstrumentNames = async () => {
      const res = await fetch('/api/instruments');
      const names = await res.json();
      setInstrumentNames(names);
    };
    fetchInstrumentNames();
  }, []);

  const exportToExcel = async () => {
    const params = new URLSearchParams();
    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    params.set('all', 'true'); // ⚠️ yêu cầu tất cả dữ liệu, bỏ phân trang

    try {
      const res = await fetch(`/api/reagInstruments?${params.toString()}`);
      const json = await res.json();

      const data = Array.isArray(json) ? json : json.data || [];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredData');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(file, 'filtered_data.xlsx');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };


  const instrumentOptions = instrumentNames.map((name) => ({ value: name, label: name }));
  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        {/* 🎛️ Instrument Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">🎛️ Instrument Name</label>
          <Select
            isMulti
            options={instrumentOptions}
            value={instrumentOptions.filter((opt) => selectedInstruments.includes(opt.value))}
            onChange={(selectedOptions) => setSelectedInstruments(selectedOptions.map(opt => opt.value))}
            placeholder="Select instruments..."
            className="text-sm"
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          />
        </div>

        {/* 📥 Download Excel */}
        <div>
          <button
            onClick={exportToExcel}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
          >
            📥 Download Excel
          </button>
        </div>
      </div>

      {loading ? (
        <p>🔄 Loading...</p>
      ) : rows.length > 0 ? (
        <>
          <div className="overflow-auto border border-gray-200 rounded-xl">
            <table className="table-auto w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th key={key} className="px-4 py-2 text-left font-semibold border-b">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-4 py-2 border-b">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p>
              Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 italic">No data found.</p>
      )}
    </div>
  );
}
