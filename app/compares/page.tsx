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

  "pro/pure_Đóng gói": string | null
  "4000/6000/8000_Đóng gói": string | null
  "c702_Đóng gói": string | null

  "pro/pure_Ổn định": string | null
  "4000/6000/8000_Ổn định": string | null
  "c702_Ổn định": string | null

  "c702_Material": string | null
  "4000/6000/8000_Material": string | null
  "pro/pure_Material": string | null

  "pro/pure_Định lượng": number | null
  "4000/6000/8000_Định lượng": number | null
  "c702_Định lượng": number | null
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

      N_tests_OBS: row["pro/pure_Định lượng"],
      O_tests_OBS: row["4000/6000/8000_Định lượng"],
      O1_tests_OBS: row["c702_Định lượng"],

      Test_per_Day: input,

      N_Result: check(input, row["pro/pure_Định lượng"]),
      O_Result: check(input, row["4000/6000/8000_Định lượng"]),
      O1_Result: check(input, row["c702_Định lượng"]),

      N_Tests: row["pro/pure_Đóng gói"],
      O_Tests: row["4000/6000/8000_Đóng gói"],
      O1_Tests: row["c702_Đóng gói"],

      N_OBS: row["pro/pure_Ổn định"],
      O_OBS: row["4000/6000/8000_Ổn định"],
      O1_OBS: row["c702_Ổn định"],

      c702_Material: row["c702_Material"],
      M4000_Material: row["4000/6000/8000_Material"],
      pro_Material: row["pro/pure_Material"],

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
    return input >= obs ? "PASS" : "FAIL"
  }

  // ==========================
  // Columns
  // ==========================
  const columns: ColumnDef<DataType>[] = [

    { accessorKey: "Application short name", header: "Application" },

    // NEW
    { accessorKey: "Long name", header: "Long Name" },



    { accessorKey: "pro/pure_Định lượng", header: "Định lượng (pro/pure)" },
    { accessorKey: "4000/6000/8000_Định lượng", header: "Định lượng (4000/6000/8000)" },
    { accessorKey: "c702_Định lượng", header: "Định lượng (c702)" },

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
        const result = check(input, row.original["pro/pure_Định lượng"])

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
        const result = check(input, row.original["4000/6000/8000_Định lượng"])

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
        const result = check(input, row.original["c702_Định lượng"])

        return (
          <span className={result === "FAIL" ? "text-red-600" : "text-green-600"}>
            {result}
          </span>
        )
      },
    },
    { accessorKey: "pro/pure_Đóng gói", header: "Đóng gói (pro/pure)" },
    { accessorKey: "4000/6000/8000_Đóng gói", header: "Đóng gói (4000/6000/8000)" },
    { accessorKey: "c702_Đóng gói", header: "Đóng gói (c702)" },

    { accessorKey: "pro/pure_Ổn định", header: "Ổn định (pro/pure)" },
    { accessorKey: "4000/6000/8000_Ổn định", header: "Ổn định (4000/6000/8000)" },
    { accessorKey: "c702_Ổn định", header: "Ổn định (c702)" },
    { accessorKey: "c702_Material", header: "Material (c702)" },
    { accessorKey: "pro/pure_Material", header: "Material (pro/pure)" },
    { accessorKey: "4000/6000/8000_Material", header: "Material (4000/6000/8000)" },
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