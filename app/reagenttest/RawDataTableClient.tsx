'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';

interface RawData {
  InstrumentName: string | null;
  Test: string | null;
  [key: string]: string | number | null;
}

interface Relation {
  instrument: string;
  test: string;
  group: 'Miễn dịch' | 'Hóa sinh' | 'Điện giải';
}

export default function RawDataTableClient() {
  const [allRelations, setAllRelations] = useState<Relation[]>([]);
  const [instrumentGroups, setInstrumentGroups] = useState<Record<string, string[]>>({
    'Miễn dịch': [],
    'Hóa sinh': [],
    'Điện giải': [],
  });

  const [productTypes, setProductTypes] = useState<string[]>([]);

  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);

  const [instrumentNames, setInstrumentNames] = useState<string[]>([]);
  const [testNames, setTestNames] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<RawData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [useSummaryApi, setUseSummaryApi] = useState(true);
  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  // ====== Fetch dữ liệu bảng ======
  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    selectedTests.forEach((test) => params.append('test', test));
    selectedProductTypes.forEach((prod) => params.append('typeofprod', prod));
    params.set('page', page.toString());

    const apiUrl = useSummaryApi
      ? `/api/reagenttest?${params.toString()}`
      : `/api/reagenttestdetail?${params.toString()}`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    setRows(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [
    selectedInstruments,
    selectedTests,
    selectedProductTypes,
    page,
    useSummaryApi, // ⚠️ nhớ thêm dependency
  ]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ====== Fetch relations ======
  useEffect(() => {
    const fetchRelations = async () => {
      const res = await fetch('/api/relations');
      const data = (await res.json()) as Relation[];

      setAllRelations(data);

      const grouped: Record<string, string[]> = {
        'Miễn dịch': [],
        'Hóa sinh': [],
        'Điện giải': [],
      };
      data.forEach((r) => {
        if (grouped[r.group] && !grouped[r.group].includes(r.instrument)) {
          grouped[r.group].push(r.instrument);
        }
      });

      setInstrumentGroups(grouped);

      const allInstruments = Array.from(new Set(data.map((r) => r.instrument))).sort();
      const allTests = Array.from(new Set(data.map((r) => r.test))).sort();

      setInstrumentNames(allInstruments);
      setTestNames(allTests);
    };

    fetchRelations();
  }, []);

  // ====== Fetch product types ======
  useEffect(() => {
    const fetchProductTypes = async () => {
      const res = await fetch('/api/typeofprod');
      const types: string[] = await res.json();
      setProductTypes(types);
    };
    fetchProductTypes();
  }, []);

  // ====== Filter Instruments khi chọn Test ======
  useEffect(() => {
    if (selectedTests.length === 0) {
      setInstrumentNames(Object.values(instrumentGroups).flat());
      return;
    }
    const instrumentsFiltered = allRelations
      .filter((r) => selectedTests.includes(r.test))
      .map((r) => r.instrument);

    setInstrumentNames(Array.from(new Set(instrumentsFiltered)).sort());
  }, [selectedTests, allRelations, instrumentGroups]);

  // ====== Filter Tests khi chọn Instrument ======
  useEffect(() => {
    if (selectedInstruments.length === 0) {
      setTestNames(Array.from(new Set(allRelations.map((r) => r.test))).sort());
      return;
    }

    const testsFiltered = allRelations
      .filter((r) => selectedInstruments.includes(r.instrument))
      .map((r) => r.test);

    setTestNames(Array.from(new Set(testsFiltered)).sort());
  }, [selectedInstruments, allRelations]);

  interface RawData {
    InstrumentName: string | null;
    Test: string | null;
    MaterialNumber?: string | null;
    Material_Name?: string | null;
    PL6?: string | null;
    ['Nhóm xét nghiệm']?: string | null | string[];
    ['Nhóm sản phẩm']?: string | null;
    [key: string]: any;
  }

  // Nếu muốn chuẩn bị type cho xuất Excel, bạn vẫn có thể giữ
  type ProcessedRow = RawData & {
    nhomXetNghiem?: string | null;
    nhomSanPham?: string | number | null;
  };

  // Trong UI, giữ nguyên dữ liệu
  const processedRows: RawData[] = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return rows; // trả về nguyên bản, không thay đổi gì
  }, [rows]);

  // ====== Export Excel ======
  function exportExcel(rows: RawData[]) {
    if (!rows || rows.length === 0) return;

    // Chỉ chuyển nguyên rows sang worksheet, không xử lý gì
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Tạo workbook và append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Xuất file
    XLSX.writeFile(workbook, 'export.xlsx');
  }
  
  // ====== UI Options ======
  const testOptions = testNames.map((name) => ({ value: name, label: name }));
  const productTypeOptions = productTypes.map((t) => ({ value: t, label: t }));

  const columnWidths: Record<string, string> = {
    InstrumentName: 'w-[100px]',
    Parametershort: 'w-[30px]',
    MaterialNumber: 'w-[100px]',
    'Material Name': 'w-[200px]',
    UsageType: 'w-[100px]',
  };

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        {Object.entries(instrumentGroups).map(([groupName, instruments]) => {
          const filteredInstruments = instruments.filter((name) =>
            instrumentNames.includes(name)
          );

          return (
            <div key={groupName}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{groupName}</label>
              <Select
                isMulti
                options={filteredInstruments.map((name) => ({ value: name, label: name }))}
                value={filteredInstruments
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
          );
        })}

        {/* Test Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">🧪 Test Name</label>
          <Select
            isMulti
            options={testOptions}
            value={testOptions.filter((opt) => selectedTests.includes(opt.value))}
            onChange={(selectedOptions) => {
              setPage(1);
              setSelectedTests(selectedOptions.map((opt) => opt.value));
            }}
            placeholder="Select tests..."
            className="text-sm"
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>

        {/* Product Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">📦 Loại sản phẩm</label>
          <Select
            isMulti
            options={productTypeOptions}
            value={productTypeOptions.filter((opt) => selectedProductTypes.includes(opt.value))}
            onChange={(selectedOptions) => setSelectedProductTypes(selectedOptions.map((opt) => opt.value))}
            placeholder="Select product types..."
            className="text-sm"
            classNamePrefix="react-select"
            menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>
      </div>

    {/* Download + Toggle */}
    <div className="flex items-center justify-between mb-4">
      {/* Download Excel */}
      <button
        onClick={() => exportExcel(processedRows)}
        className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
      >
        📥 Download Excel
      </button>

      {/* Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useSummaryApi}
          onChange={(e) => {
            setUseSummaryApi(e.target.checked);
            setPage(1);
          }}
        />
        <span>Danh sách tổng hợp</span>
      </label>
    </div>

      {/* Table */}
      {loading ? (
        <p>🔄 Loading...</p>
      ) : (
        <>
          <div className="overflow-auto border border-gray-200 rounded-xl">
            <table className="table-auto w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(processedRows[0] ?? {}).map((key) => (
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
                {processedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-4 py-2 border-b">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
