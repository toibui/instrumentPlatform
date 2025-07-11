'use client';

import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface RawData {
  InstrumentName: string | null;
  Test: string | null;
  [key: string]: string | number | null;
}

export default function RawDataTableClient() {
  const [allRelations, setAllRelations] = useState<{ instrument: string; test: string }[]>([]);
  const [allInstruments, setAllInstruments] = useState<string[]>([]);
  const [allTests, setAllTests] = useState<string[]>([]);

  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const [instrumentNames, setInstrumentNames] = useState<string[]>([]);
  const [testNames, setTestNames] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<RawData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  // 🟢 Fetch bảng dữ liệu
  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    selectedTests.forEach((test) => params.append('test', test));
    params.set('page', page.toString());

    const res = await fetch(`/api/dashboards?${params.toString()}`);
    const json = await res.json();

    setRows(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [selectedInstruments, selectedTests, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔁 Lấy quan hệ 1 lần
  useEffect(() => {
    const fetchRelations = async () => {
      const res = await fetch('/api/relations');
      const data = (await res.json()) as { instrument: string; test: string }[];

      setAllRelations(data);

      const uniqueInstruments = Array.from(new Set(data.map((r) => r.instrument))).sort();
      const uniqueTests = Array.from(new Set(data.map((r) => r.test))).sort();

      setAllInstruments(uniqueInstruments);
      setAllTests(uniqueTests);
      setInstrumentNames(uniqueInstruments);
      setTestNames(uniqueTests);
    };

    fetchRelations();
  }, []);


  // 🔁 Khi chọn Test → lọc Instrument
  useEffect(() => {
    if (selectedTests.length === 0) {
      setInstrumentNames(allInstruments);
      return;
    }

    const instrumentsFiltered = allRelations
      .filter((r) => selectedTests.includes(r.test))
      .map((r) => r.instrument);

    setInstrumentNames(Array.from(new Set(instrumentsFiltered)).sort());
  }, [selectedTests, allRelations, allInstruments]);

  // 🔁 Khi chọn Instrument → lọc Test
  useEffect(() => {
    if (selectedInstruments.length === 0) {
      setTestNames(allTests);
      return;
    }

    const testsFiltered = allRelations
      .filter((r) => selectedInstruments.includes(r.instrument))
      .map((r) => r.test);

    setTestNames(Array.from(new Set(testsFiltered)).sort());
  }, [selectedInstruments, allRelations, allTests]);

  // 📦 Xuất Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredData');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, 'filtered_data.xlsx');
  };

  // 🧩 UI Options
  const instrumentOptions = instrumentNames.map((name) => ({ value: name, label: name }));
  const testOptions = testNames.map((name) => ({ value: name, label: name }));

  // 🎛️ Chiều rộng cột tuỳ chỉnh
  const columnWidths: Record<string, string> = {
    InstrumentName: 'w-[100px]',
    Parametershort: 'w-[30px]',
    MaterialNumber: 'w-[100px]',
    "Material Name": 'w-[200px]',
    UsageType: 'w-[100px]',
  };

  return (
    <div>
      {/* 🔍 Bộ lọc */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        {/* 🎛️ Instrument */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">🎛️ Instrument Name</label>
          <Select
            isMulti
            options={instrumentOptions}
            value={instrumentOptions.filter((opt) => selectedInstruments.includes(opt.value))}
            onChange={(selectedOptions) => {
              setPage(1);
              setSelectedInstruments(selectedOptions.map(opt => opt.value));
              // ❗️Nếu bạn KHÔNG muốn reset test khi đổi instrument thì xóa dòng này
              setSelectedTests([]);
            }}
            placeholder="Select instruments..."
            className="text-sm"
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          />
        </div>

        {/* 🧪 Test */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">🧪 Test Name</label>
          <Select
            isMulti
            options={testOptions}
            value={testOptions.filter((opt) => selectedTests.includes(opt.value))}
            onChange={(selectedOptions) => {
              setPage(1);
              setSelectedTests(selectedOptions.map(opt => opt.value));
            }}
            placeholder="Select tests..."
            className="text-sm"
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          />
        </div>

        {/* 📥 Excel */}
        <div>
          <button
            onClick={exportToExcel}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
          >
            📥 Download Excel
          </button>
        </div>
      </div>

      {/* 🧾 Bảng dữ liệu */}
      {loading ? (
        <p>🔄 Loading...</p>
      ) : (
        <>
          <div className="overflow-auto border border-gray-200 rounded-xl">
            <table className="table-auto w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0] ?? {}).map((key) => (
                    <th
                      key={key}
                      className={`px-4 py-2 text-left font-semibold border-b ${columnWidths[key] ?? ''} truncate`}
                    >
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

          {/* 🔁 Phân trang */}
          <div className="flex justify-between items-center mt-4">
            <p>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
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
      )}
    </div>
  );
}
