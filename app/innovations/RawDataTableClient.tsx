'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import * as XLSX from 'xlsx';

interface RawData {
  [key: string]: any;
}

export default function RawDataTableClient() {
  const limit = 50;

  const [rows, setRows] = useState<RawData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Column filters
  const [columnFilters, setColumnFilters] = useState<{
    [key: string]: string;
  }>({});

  // Debounce filters
  const [debouncedFilters, setDebouncedFilters] = useState(columnFilters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(columnFilters);
    }, 300);

    return () => clearTimeout(handler);
  }, [columnFilters]);

  const totalPages = Math.ceil(total / limit);

  // ================= FETCH DATA =================
  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    selectedProjects.forEach((p) => params.append('project', p));
    params.set('page', page.toString());

    const res = await fetch(`/api/innovations?${params.toString()}`);
    const json = await res.json();

    setRows(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [selectedProjects, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= FETCH PROJECT TYPES =================
  useEffect(() => {
    const fetchProjects = async () => {
      const res = await fetch('/api/projects');
      const projects: string[] = await res.json();
      setProductTypes(projects);
    };
    fetchProjects();
  }, []);

  // ================= CLIENT FILTER =================
  const processedRows = useMemo(() => {
    if (!rows) return [];

    return rows.filter((row) =>
      Object.entries(debouncedFilters).every(([key, value]) => {
        if (!value) return true;

        return String(row[key] ?? '')
          .toLowerCase()
          .includes(value.toLowerCase());
      })
    );
  }, [rows, debouncedFilters]);

  // ================= EXPORT FULL DATA =================
  const exportExcel = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    selectedProjects.forEach((p) => params.append('project', p));
    params.set('all', 'true');

    const res = await fetch(`/api/innovations?${params.toString()}`);
    const json = await res.json();

    const worksheet = XLSX.utils.json_to_sheet(json.data ?? []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    XLSX.writeFile(workbook, 'export.xlsx');

    setLoading(false);
  };

  const productTypeOptions = productTypes.map((t) => ({
    value: t,
    label: t,
  }));

  const columnKeys = rows.length > 0 ? Object.keys(rows[0]) : [];

  // ================= UI =================
  return (
    <div className="p-6">

      {/* FILTER PROJECT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">
            📦 Chương trình chuyển đổi
          </label>
          <Select
            isMulti
            options={productTypeOptions}
            value={productTypeOptions.filter((opt) =>
              selectedProjects.includes(opt.value)
            )}
            onChange={(selected) => {
              setPage(1);
              setSelectedProjects(selected.map((opt) => opt.value));
            }}
          />
        </div>
      </div>

      {/* DOWNLOAD */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
        >
          📥 Download Full Excel
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>🔄 Loading...</p>
      ) : (
        <>
          <div className="overflow-auto border rounded-xl max-h-[75vh]">
            <table className="min-w-[1600px] text-sm border-collapse w-full">
              
              <thead className="bg-gray-100 sticky top-0 z-10">

                {/* HEADER */}
                <tr>
                  {columnKeys.map((key) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left border-b font-semibold whitespace-nowrap"
                    >
                      {key}
                    </th>
                  ))}
                </tr>

                {/* FILTER ROW */}
                <tr>
                  {columnKeys.map((key) => (
                    <th key={key} className="px-3 py-1 border-b">
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters[key] || ''}
                        onChange={(e) =>
                          setColumnFilters((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 text-xs border rounded"
                      />
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {processedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 align-top">
                    {Object.entries(row).map(([key, val], i) => {

                      // Format date
                      if (
                        typeof val === 'string' &&
                        val.includes('00:00:00') &&
                        !isNaN(Date.parse(val))
                      ) {
                        val = new Date(val).toLocaleDateString('vi-VN');
                      }

                      // Active badge
                      if (val === 'Active') {
                        return (
                          <td key={i} className="px-3 py-2 border-b">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Active
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={i}
                          className="px-3 py-2 border-b whitespace-normal break-words max-w-[300px]"
                        >
                          {val ?? ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4">
            <p>
              Showing {(page - 1) * limit + 1}–
              {Math.min(page * limit, total)} of {total}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                ← Prev
              </button>

              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
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
