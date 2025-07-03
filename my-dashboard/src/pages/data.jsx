import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // ✅ if using Supabase

export default function Data() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        // ✅ Get user ID from Supabase, fallback to "default"
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;

        const userId = user?.id || "default";

        const response = await fetch(`http://localhost:5000/data/${userId}`);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Received:", data);

        // ✅ If your server returns an array directly:
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          console.error("Unexpected response format:", data);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExcelData();
  }, []);

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-blue-50 to-blue-100">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Your Excel Data
      </h2>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-gray-600">No data found.</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full bg-white border rounded shadow text-xs">
            <thead>
              <tr>
                {Object.keys(rows[0]).map((col) => (
                  <th key={col} className="border px-4 py-2 bg-gray-200">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-100">
                  {Object.keys(row).map((col) => (
                    <td key={col} className="border px-4 py-2">
                      {row[col] !== undefined ? row[col].toString() : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
