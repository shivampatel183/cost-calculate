import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient"; // update path accordingly

const columnMap = [
  "date",
  "greenBox300x1200",
  "greenBox200x1000",
  "greenBox150x900",
  "greenBox200x1200",
  "greenBox400x400",
  "pressBox600x600",
  "pressBox200x1000",
  "pressBox150x900",
  "pressBox200x1200",
  "pressBox400x400",
  "colorBox200x1000",
  "wpBox600x600",
  "semiBox600x600",
  "beforeFlow600x600",
  "beforeFlow200x1000",
  "beforeFlow150x900",
  "beforeFlow200x1200",
  "beforeFlow400x400",
  "kilnEntry600x600",
  "kilnEntry200x1000",
  "kilnEntry150x900",
  "kilnEntry200x1200",
  "kilnEntry400x400",
  "packingBox600x600",
  "packingBox200x1000",
  "packingBox150x900",
  "packingBox200x1200",
  "packingBox400x400",
  "firedLoss600x600",
  "fireLoss200x1000",
  "fireLoss200x1200",
  "kilnFireLoss400x400",
  "sizingFireLoss400x400",
  "sprayDryerProduction",
  "coalConsumption",
  "electricityUnits",
  "gasConsumption",
  "preBox600x600",
  "stdBox600x600",
  "ecoBox600x600",
  "preBox200x1000",
  "stdBox200x1000",
  "ecoBox200x1000",
  "preBox150x900",
  "stdBox150x900",
  "ecoBox150x900",
  "preBox200x1200",
  "stdBox200x1200",
  "ecoBox200x1200",
  "preBox400x400",
  "stdBox400x400",
  "ecoBox400x400",
  "baseKg6",
  "brownKg6",
  "blackKg6",
  "blueKg6",
  "greenKg6",
  "baseKg2",
  "brownKg2",
  "blackKg2",
  "blueKg2",
  "greenKg2",
  "baseKg15",
  "brownKg15",
  "blackKg15",
  "blueKg15",
  "greenKg15",
  "beigeKg12",
  "brownKg12",
  "blackKg12",
  "blueKg12",
  "redKg12",
  "yellowKg12",
  "greenInk12",
  "carving12",
  "baseKg4",
  "brownKg4",
  "blackKg4",
  "blueKg4",
  "redKg4",
  "yellowKg4",
  "greenKg4",
  "maintenance",
  "legalUnlegal",
  "office",
  "diesel",
  "freight",
  "kilnGap",
  "cumulativeKilnGap",
];

export default function InputSheet() {
  const [input, setInput] = useState({});
  const [pdfUrl, setPdfUrl] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow empty string for clearing the field
    if (value === "") {
      setInput((prev) => ({
        ...prev,
        [name]: 0,
      }));
      return;
    }

    const isValid = /^-?\d*\.?\d*$/.test(value);
    if (!isValid) return;

    const numericValue = parseFloat(value);
    const finalValue =
      !isNaN(numericValue) && value !== "." && !value.endsWith(".")
        ? numericValue
        : value;

    setInput((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert("User not logged in");
      return;
    }

    const parsedInput = {};
    for (const key in input) {
      const val = input[key];
      if (val === null || val === "") {
        parsedInput[key] = null;
      } else if (typeof val === "string") {
        const numVal = parseFloat(val);
        parsedInput[key] = !isNaN(numVal)
          ? Math.round(numVal * 100) / 100
          : null;
      } else {
        parsedInput[key] = Math.round(val * 100) / 100;
      }
    }

    const fullData = {
      ...parsedInput,
      userId,
    };

    try {
      const res = await axios.post("http://localhost:5000/submit", fullData);
      setPdfUrl("http://localhost:5000" + res.data.pdf);
    } catch (err) {
      alert("Error generating PDF");
      console.error(err);
    }
  };

  const getInputType = (fieldName) => {
    // Special handling for date field
    if (fieldName === "date") {
      return "date";
    }
    return "number";
  };

  const getInputProps = (fieldName) => {
    if (fieldName === "date") {
      return {};
    }
    return {
      step: "0.01",
      min: undefined, // Allow negative numbers
    };
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Full Input Sheet</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columnMap.map((col) => (
          <div key={col} className="flex flex-col">
            <label className="font-medium text-sm mb-1">{col}</label>
            <input
              type={Number}
              name={col}
              value={input[col] ?? ""}
              onChange={handleChange}
              className="border rounded p-2"
              placeholder={`Enter ${col}`}
              {...getInputProps(col)}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Submit and Generate PDF
      </button>

      {pdfUrl && (
        <div className="mt-4">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download Generated PDF
          </a>
        </div>
      )}
    </div>
  );
}
