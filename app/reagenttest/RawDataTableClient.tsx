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

  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  // Fetch dữ liệu bảng
  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    selectedInstruments.forEach((inst) => params.append('instrument', inst));
    selectedTests.forEach((test) => params.append('test', test));
    selectedProductTypes.forEach((prod) => params.append('typeofprod', prod));
    params.set('page', page.toString());

    const res = await fetch(`/api/reagenttest?${params.toString()}`);
    const json = await res.json();

    setRows(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [selectedInstruments, selectedTests, selectedProductTypes, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lấy quan hệ và nhóm máy
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

  // Lấy danh sách loại sản phẩm
  useEffect(() => {
    const fetchProductTypes = async () => {
      const res = await fetch('/api/typeofprod');
      const types: string[] = await res.json();
      setProductTypes(types);
    };
    fetchProductTypes();
  }, []);

  // Khi chọn Test → lọc Instrument
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

  // Khi chọn Instrument → lọc Test
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

  const exportToExcel = async () => {
  const params = new URLSearchParams();
  selectedInstruments.forEach((inst) => params.append('instrument', inst));
  selectedTests.forEach((test) => params.append('test', test));
  selectedProductTypes.forEach((prod) => params.append('typeofprod', prod));

  const res = await fetch(`/api/reagenttest?${params.toString()}&all=true`);
  const json = (await res.json()) as { data: RawData[]; total: number };

  if (!json.data || json.data.length === 0) return;

  // ===============================
  // 1. EXPLODE Nhóm xét nghiệm
  // ===============================
    const explodedData: RawData[] = [];

    json.data.forEach((item) => {
      const rawTests = item['Nhóm xét nghiệm'];
      const nhomSanPham = item['Nhóm sản phẩm'] ?? null;

      if (typeof rawTests !== 'string') {
        explodedData.push({
          ...item,
          nhomXetNghiem: rawTests ?? null,
          nhomSanPham,
        });
        return;
      }

      rawTests.split(',').forEach((test) => {
        explodedData.push({
          ...item,
          nhomXetNghiem: test.trim(),
          nhomSanPham,
        });
      });
    });

    // ===============================
    // 2. PRIORITY MAP Nhóm sản phẩm
    // ===============================
    const priorityMap: Record<string, number> = {
      'Hóa chất': 0,
      'Chất chuẩn (QC)': 1,
      'Chất hiệu chuẩn (Cal)': 2,
      'Phụ trợ': 3,
    };

    // ===============================
    // 3. SORT
    //    Nhóm xét nghiệm → Nhóm sản phẩm
    // ===============================
    explodedData.sort((a, b) => {
      const testA = a.nhomXetNghiem ?? '';
      const testB = b.nhomXetNghiem ?? '';

      if (testA < testB) return -1;
      if (testA > testB) return 1;

      const priA = priorityMap[a.nhomSanPham ?? ''] ?? 99;
      const priB = priorityMap[b.nhomSanPham ?? ''] ?? 99;

      return priA - priB;
    });

    // ===============================
    // 4. CHỈ GIỮ CỘT ĐANG HIỂN THỊ UI
    // ===============================
    const visibleColumns = Object.keys(rows[0] ?? {});

    const filteredData: RawData[] = explodedData.map((row) => {
      const filteredRow: RawData = {
        InstrumentName: row.InstrumentName ?? null,
        Test: row.Test ?? null,
      };

      visibleColumns.forEach((col) => {
        filteredRow[col] = row[col] ?? null;
      });

      return filteredRow;
    });

    // ===============================
    // 5. EXPORT EXCEL
    // ===============================
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FilteredData');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const file = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(file, 'filtered_data.xlsx');
  };



  // UI
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
        {/* Instrument theo nhóm có filter theo instrumentNames */}
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

        {/* Filter Test */}
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

        {/* Filter loại sản phẩm */}
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

      {/* Nút Download Excel */}
      <div className="flex justify-start mb-4">
        <button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
        >
          📥 Download Excel
        </button>
      </div>

      {/* Bảng */}
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

          {/* Phân trang */}
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
