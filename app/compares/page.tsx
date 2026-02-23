"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,

} from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

type DataType = {
  Category: string
  "Indication area": string
  "Application short name": string
  "Long name": string

  N_of_tests: string | null
  O_of_tests: string | null
  O1_of_tests: string | null

  N_OBS: string | null
  O_OBS: string | null
  O1_OBS: string | null

  N_of_tests_OBS: number | null
  O_of_tests_OBS: number | null
  O1_of_tests_OBS: number | null
}



export default function TestTable() {
  const [data, setData] = useState<DataType[]>([])
  const [globalTest, setGlobalTest] = useState<number>(0)

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedIndication, setSelectedIndication] = useState<string>("ALL")

  const [rowInputs, setRowInputs] = useState<Record<number, number>>({})

  // ==========================
  // Fetch data từ API
  // ==========================
  useEffect(() => {
    fetch("/api/compares")
      .then(res => res.json())
      .then(res => setData(res.data))
  }, [])
    const handleExportExcel = () => {
  // Chuẩn bị dữ liệu export (nên dùng filteredData)
  const exportData = filteredData.map((row, index) => {
    const input = rowInputs[index] ?? globalTest

    return {
      Application: row["Application short name"],
      LongName: row["Long name"],

      N_tests_OBS: row.N_of_tests_OBS,
      O_tests_OBS: row.O_of_tests_OBS,
      O1_tests_OBS: row.O1_of_tests_OBS,

      Test_per_Day: input,

      N_Result: check(input, row.N_of_tests_OBS),
      O_Result: check(input, row.O_of_tests_OBS),
      O1_Result: check(input, row.O1_of_tests_OBS),

      N_Tests: row.N_of_tests,
      O_Tests: row.O_of_tests,
      O1_Tests: row.O1_of_tests,

      N_OBS: row.N_OBS,
      O_OBS: row.O_OBS,
      O1_OBS: row.O1_OBS,

      Category: row.Category,
      Indication: row["Indication area"],
    }
  })
    // Excel export logic
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "TestData")

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })

    saveAs(data, "TestData.xlsx")
  }
  // ==========================
  // Filter client-side
  // ==========================
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchCategory =
        selectedCategory === "ALL" ||
        row.Category === selectedCategory

      const matchIndication =
        selectedIndication === "ALL" ||
        row["Indication area"] === selectedIndication

      return matchCategory && matchIndication
    })
  }, [data, selectedCategory, selectedIndication])

  // ==========================
  // Unique filter options
  // ==========================
  const categories = ["ALL", ...Array.from(new Set(data.map(d => d.Category)))]
  const indications = [
    "ALL",
    ...Array.from(new Set(data.map(d => d["Indication area"])))
  ]

  // ==========================
  // PASS / FAIL logic
  // ==========================
  const check = (input: number, obs: number | null) => {
    if (obs == null) return ""
    return input <= obs ? "PASS" : "FAIL"
  }

  // ==========================
  // Columns
  // ==========================
  const columns: ColumnDef<DataType>[] = [

    { accessorKey: "Application short name", header: "Application" },

    // NEW
    { accessorKey: "Long name", header: "Long Name" },



    { accessorKey: "N_of_tests_OBS", header: "N_tests/OBS" },
    { accessorKey: "O_of_tests_OBS", header: "O_tests/OBS" },
    { accessorKey: "O1_of_tests_OBS", header: "O1_tests/OBS" },

    {
      header: "Test/Day",
      cell: ({ row }) => {
        const index = row.index
        const value = rowInputs[index] ?? globalTest

        return (
          <input
            type="number"
            className="border p-1 w-24"
            value={value}
            onChange={(e) =>
              setRowInputs(prev => ({
                ...prev,
                [index]: Number(e.target.value),
              }))
            }
          />
        )
      },
    },

    {
      header: "N Result",
      cell: ({ row }) => {
        const input = rowInputs[row.index] ?? globalTest
        const result = check(input, row.original.N_of_tests_OBS)

        return (
          <span className={result === "FAIL" ? "text-red-600" : "text-green-600"}>
            {result}
          </span>
        )
      },
    },

    {
      header: "O Result",
      cell: ({ row }) => {
        const input = rowInputs[row.index] ?? globalTest
        const result = check(input, row.original.O_of_tests_OBS)

        return (
          <span className={result === "FAIL" ? "text-red-600" : "text-green-600"}>
            {result}
          </span>
        )
      },
    },

    {
      header: "O1 Result",
      cell: ({ row }) => {
        const input = rowInputs[row.index] ?? globalTest
        const result = check(input, row.original.O1_of_tests_OBS)

        return (
          <span className={result === "FAIL" ? "text-red-600" : "text-green-600"}>
            {result}
          </span>
        )
      },
    },
    { accessorKey: "N_of_tests", header: "N Tests" },
    { accessorKey: "O_of_tests", header: "O Tests" },
    { accessorKey: "O1_of_tests", header: "O1 Tests" },

    { accessorKey: "N_OBS", header: "N OBS" },
    { accessorKey: "O_OBS", header: "O OBS" },
    { accessorKey: "O1_OBS", header: "O1 OBS" },
    { accessorKey: "Category", header: "Category" },
    { accessorKey: "Indication area", header: "Indication Area" },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-6 space-y-4">

      {/* Global Input */}
      <div className="flex gap-4">
        <input
          type="number"
          placeholder="Global Test/Day"
          className="border p-2"
          value={globalTest}
          onChange={(e) => setGlobalTest(Number(e.target.value))}
        />
        <select
          className="border p-2"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          className="border p-2"
          value={selectedIndication}
          onChange={(e) => setSelectedIndication(e.target.value)}
        >
          {indications.map((ind, i) => (
            <option key={i} value={ind}>{ind}</option>
          ))}
        </select>

        <button
          onClick={handleExportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="border p-2 text-left">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="border p-2">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}