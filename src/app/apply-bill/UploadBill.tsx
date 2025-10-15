// UploadBill.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { BillFormData } from "./types";
import { useRouter } from "next/navigation";

interface UploadBillProps {
  onBillSubmitted: () => void;
}

const UploadBill: React.FC<UploadBillProps> = ({ onBillSubmitted }) => {
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [formData, setFormData] = useState<BillFormData>({
    employee_id: "",
    employee_name: "",
    po_details: "",
    po_value: "",
    supplier_name: "",
    supplier_address: "",
    item_category: "Minor",
    item_description: "",
    qty: "",
    bill_details: "",
    indenter_name: "",
    qty_issued: "",
    source_of_fund: "",
    stock_entry: "",
    location: "",
  });

  // ---------- Helpers ----------
  const normalizeText = (val: string) => val.replace(/\s+/g, " ").trim();
  const normalizeEmployeeId = (val: string) => normalizeText(val).toUpperCase();

  // Robust PDA balance lookup (handles case/whitespace)
  const fetchPdaBalanceById = async (rawId: string) => {
    const id = normalizeEmployeeId(rawId);
    // 1) exact match
    let { data, error } = await supabase
      .from("pda_balances")
      .select("employee_id,balance,department")
      .eq("employee_id", id)
      .maybeSingle();
    if (data && !error) return data.balance as number | null;

    // 2) case-insensitive match
    const res2 = await supabase
      .from("pda_balances")
      .select("employee_id,balance,department")
      .ilike("employee_id", id)
      .maybeSingle();
    if (res2.data && !res2.error) return res2.data.balance as number | null;

    // 3) loose match (contains); then pick the exact trimmed match if exists
    const res3 = await supabase
      .from("pda_balances")
      .select("employee_id,balance,department")
      .ilike("employee_id", `%${id}%`)
      .limit(5);
    if (res3.data && res3.data.length > 0) {
      const exact = res3.data.find((r: any) => normalizeEmployeeId(r.employee_id) === id);
      return (exact?.balance ?? res3.data[0]?.balance) as number | null;
    }
    return null;
  };

  // Fetch PDA balance when employee_id changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!formData.employee_id) {
        setBalance(null);
        return;
      }
      try {
        const bal = await fetchPdaBalanceById(formData.employee_id);
        setBalance(bal != null ? Number(bal) : null);
      } catch (err) {
        console.error("Error fetching PDA balance:", err);
        setBalance(null);
      }
    };
    fetchBalance();
  }, [formData.employee_id]);

  // ---------- Submit handler ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const billValue = parseFloat(String(formData.po_value).replace(/,/g, ""));

    // Basic validation
    if (!formData.employee_id || !formData.employee_name) {
      alert("Employee ID and Name are required.");
      return;
    }
    if (isNaN(billValue) || billValue <= 0) {
      alert("Enter a valid bill amount.");
      return;
    }

    const normalizedEmployeeId = normalizeEmployeeId(formData.employee_id);
    const normalizedEmployeeName = normalizeText(formData.employee_name);

    // Check PDA balance
    const foundBalance = await fetchPdaBalanceById(normalizedEmployeeId);
    if (foundBalance == null) {
      alert("Invalid Employee ID or no PDA balance found.");
      return;
    }

    if (foundBalance < billValue) {
      alert("Insufficient PDA balance. Cannot submit bill.");
      return;
    }

    // Lookup employee department (use same matching approach)
    const { data: empData, error: empErr } = await supabase
      .from("pda_balances")
      .select("department")
      .ilike("employee_id", normalizedEmployeeId)
      .maybeSingle();

    if (empErr || !empData) {
      alert("Could not find employee department.");
      return;
    }

    // Determine workflow flags
    const category = formData.item_category;
    let snp: "Pending" | null = null;
    let audit: "Pending" | null = null;
    let status: string = "User";

    if (category === "Consumables") {
      snp = null;
      status = billValue <= 50000 ? "Finance Admin" : "Audit";
      if (status === "Audit") audit = "Pending";
    } else {
      snp = "Pending";
      status = "Student Purchase";
    }

    // Prepare normalized payload for DB
    const normalizedData: any = {
      ...formData,
      employee_id: normalizedEmployeeId,
      employee_name: normalizedEmployeeName,
      po_details: normalizeText(formData.po_details || ""),
      supplier_name: normalizeText(formData.supplier_name || ""),
      supplier_address: normalizeText(formData.supplier_address || ""),
      item_description: normalizeText(formData.item_description || ""),
      bill_details: normalizeText(formData.bill_details || ""),
      indenter_name: normalizeText(formData.indenter_name || ""),
      source_of_fund: normalizeText(formData.source_of_fund || ""),
      stock_entry: normalizeText(formData.stock_entry || ""),
      location: normalizeText(formData.location || ""),
      po_value: billValue,
      qty: formData.qty ? parseInt(String(formData.qty).replace(/,/g, "")) : null,
      qty_issued: formData.qty_issued
        ? parseInt(String(formData.qty_issued).replace(/,/g, ""))
        : null,
      item_category: category,
      snp,
      audit,
      status,
      finance_admin: status === "Finance Admin" && billValue <= 50000 ? "Pending" : null,
      employee_department: empData.department || null,
    };

    // Normalize empty strings to null for optional text fields
    const optionalFields = [
      "po_details",
      "supplier_name",
      "supplier_address",
      "item_description",
      "bill_details",
      "indenter_name",
      "source_of_fund",
      "stock_entry",
      "location",
    ];
    optionalFields.forEach((field) => {
      if (!normalizedData[field] || normalizedData[field] === "") normalizedData[field] = null;
    });

    try {
      // 1) Deduct PDA balance (case-insensitive)
      const { error: updateErr } = await supabase
        .from("pda_balances")
        .update({ balance: foundBalance - billValue, updated_at: new Date() })
        .ilike("employee_id", normalizedEmployeeId);

      if (updateErr) {
        console.error("Error updating PDA balance:", updateErr.message);
        alert("Error updating PDA balance.");
        return;
      }

      // 2) Insert bill and request the inserted id
      const { data: insertedBill, error: insertErr } = await supabase
        .from("bills")
        .insert([normalizedData])
        .select("id")
        .single();

      if (insertErr || !insertedBill) {
        console.error("Failed to insert bill:", insertErr?.message || insertErr);
        alert("Failed to upload bill: " + (insertErr?.message ?? "Unknown error"));
        return;
      }

      const newBillId = insertedBill.id;

      // Optional: notify parent component that a bill was submitted
      try { onBillSubmitted(); } catch (e) { /* ignore */ }
      
    } catch (err: any) {
      console.error("Unexpected error during bill submission:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // ---------- Render form ----------
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Upload New Bill</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 bg-white shadow p-6 rounded-lg border"
      >
        {Object.keys(formData).map((field) => (
          <div key={field} className="col-span-1">
            <label className="block text-gray-700 capitalize">
              {field.replace(/_/g, " ")}
            </label>

            {field === "item_category" ? (
              <select
                value={formData[field as keyof BillFormData]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value as any })}
                className="w-full border p-2 rounded"
              >
                <option>Minor</option>
                <option>Major</option>
                <option>Consumables</option>
              </select>
            ) : (
              <input
                type={field.includes("qty") || field.includes("value") ? "number" : "text"}
                value={formData[field as keyof BillFormData]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full border p-2 rounded"
                required={field === "employee_id" || field === "employee_name"}
              />
            )}
          </div>
        ))}

        <div className="col-span-2">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-600 text-white py-2 rounded-lg shadow"
          >
            Submit Bill
          </motion.button>
        </div>

        {balance !== null && (
          <div className="col-span-2 text-gray-600">
            Current PDA Balance: ₹ {balance.toFixed(2)}
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadBill;
