'use client';

import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Instrument {
  name: string;
  group: 'Miễn dịch' | 'Hóa sinh' | 'Điện giải';
}
interface RawData {
  InstrumentName: string | null;
  [key: string]: string | number | null;
}

export default function RawDataTableClient() {
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [instrumentGroups, setInstrumentGroups] = useState<Record<string, string[]>>({
    'Miễn dịch': [],
    'Hóa sinh': [],
    'Điện giải': [],
  });
  const [productTypes, setProductTypes] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<RawData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    selectedProductTypes.forEach((prod) => params.append('typeofprod', prod));
    params.set('page', page.toString());

    const res = await fetch(`/api/reagInstruments?${params.toString()}`);
    const json = await res.json();

    const data = Array.isArray(json) ? json : json.data || [];
    const totalItems = Array.isArray(json) ? json.length : json.total || 0;

    setRows(data);
    setTotal(totalItems);
    setLoading(false);
  }, [selectedInstruments, selectedProductTypes, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Lấy danh sách máy + nhóm
    const fetchInstrumentNames = async () => {
      const res = await fetch('/api/instruments');
      const instruments: Instrument[] = await res.json();

      const grouped: Record<string, string[]> = {
        'Miễn dịch': [],
        'Hóa sinh': [],
        'Điện giải': [],
      };
      instruments.forEach((inst) => {
        if (grouped[inst.group]) {
          grouped[inst.group].push(inst.name);
        }
      });
      setInstrumentGroups(grouped);
    };

    // Lấy danh sách loại sản phẩm
    const fetchProductTypes = async () => {
      const res = await fetch('/api/typeofprod');
      const types: string[] = await res.json();
      setProductTypes(types);
    };

    fetchInstrumentNames();
    fetchProductTypes();
  }, []);

  const exportToExcel = async () => {
    const params = new URLSearchParams();
    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    selectedProductTypes.forEach((prod) => params.append('typeofprod', prod));
    params.set('all', 'true');

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
  
  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      {/* 🎛️ Filter */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        {Object.entries(instrumentGroups).map(([groupName, instruments]) => (
          <div key={groupName}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {groupName}
            </label>
            <Select
              isMulti
              options={instruments.map((name) => ({ value: name, label: name }))}
              value={instruments
                .filter((name) => selectedInstruments.includes(name))
                .map((name) => ({ value: name, label: name }))}
              onChange={(selectedOptions) =>
                setSelectedInstruments((prev) => {
                  const others = prev.filter((p) => !instruments.includes(p));
                  return [...others, ...selectedOptions.map((opt) => opt.value)];
                })
              }
              placeholder={`Select ${groupName}...`}
              className="text-sm"
              classNamePrefix="react-select"
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        ))}

        {/* 📦 Filter loại sản phẩm */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            📦 Loại sản phẩm
          </label>
          <Select
            isMulti
            options={productTypes.map((t) => ({ value: t, label: t }))}
            value={productTypes
              .filter((t) => selectedProductTypes.includes(t))
              .map((t) => ({ value: t, label: t }))}
            onChange={(selectedOptions) =>
              setSelectedProductTypes(selectedOptions.map((opt) => opt.value))
            }
            placeholder="Select product types..."
            className="text-sm"
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>
      </div>

      {/* 📥 Download Excel - ngay trên bảng, dòng riêng */}
      <div className="flex justify-start mb-4">
        <button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
        >
          📥 Download Excel
        </button>
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