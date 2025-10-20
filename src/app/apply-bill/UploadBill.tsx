// UploadBill.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { BillFormData } from "./types";

interface UploadBillProps {
  onBillSubmitted: () => void;
}

const UploadBill: React.FC<UploadBillProps> = ({ onBillSubmitted }) => {
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

  // Helpers for sanitization
  const normalizeText = (val: string) => val.replace(/\s+/g, " ").trim();
  const normalizeEmployeeId = (val: string) => normalizeText(val).toUpperCase();

  // DEBUG: Log normalized employee id and current formData
  useEffect(() => {
    if (formData.employee_id) {
      console.log('[DEBUG] Employee ID (form):', formData.employee_id);
      console.log('[DEBUG] Normalized Employee ID:', normalizeEmployeeId(formData.employee_id));
    }
    console.log('[DEBUG] formData:', formData);
  }, [formData]);

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
      if (!formData.employee_id) return;
      try {
        const bal = await fetchPdaBalanceById(formData.employee_id);
        if (bal == null) setBalance(null); else setBalance(Number(bal));
      } catch (err) {
        console.error(err);
        setBalance(null);
      }
    };
    fetchBalance();
  }, [formData.employee_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('[DEBUG] Submitting this bill data (JSON):\n' + JSON.stringify(formData, null, 2));
    console.log('[DEBUG] Submit called with formData:', formData);
    const billValue = parseFloat(String(formData.po_value).replace(/,/g, ""));
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
    const foundBalance = await fetchPdaBalanceById(normalizedEmployeeId);
    if (foundBalance == null) {
      alert("Invalid Employee ID or no PDA balance found.");
      return;
    }
    const currentBalance = parseFloat(String(foundBalance));
    if (currentBalance < billValue) {
      alert("Insufficient PDA balance. Cannot submit bill.");
      return;
    }
    // Determine initial workflow per new rules
    // Major/Minor: send to SNP first.
    //   - If amount <= 50k, after SNP approval -> Finance Admin
    //   - If amount > 50k, after SNP approval -> Audit (then Finance Admin)
    // Consumables: do not send to SNP.
    //   - If amount <= 50k -> Finance Admin directly
    //   - If amount > 50k -> Audit (then Finance Admin)
    let category = formData.item_category;
    let snp: "Pending" | "Reject" | "Hold" | "Approved" | null = null;
    let audit: "Pending" | "Reject" | "Hold" | "Approved" | null = null;
    let status: string = "User";

    if (category === "Consumables") {
      // Skip SNP completely
      snp = null;
      if (billValue <= 50000) {
        status = "Finance Admin";
        audit = null;
        // Ensure it appears in Finance Admin review
        // by marking finance_admin as Pending
        
      } else {
        status = "Audit";
        audit = "Pending";
      }
    } else {
      // Treat both Major and Minor the same for initial routing: go to SNP
      snp = "Pending";
      audit = null;
      status = "Student Purchase";
    }

    // Prepare normalizedData (existing logic)
    let normalizedData: any = {
      ...formData,
      employee_id: normalizedEmployeeId,
      employee_name: normalizedEmployeeName,
      po_value: billValue,
      item_category: formData.item_category,
      status,
      snp,
      audit,
    };
    // Remove empty string -> null for all fields
    Object.keys(normalizedData).forEach((key) => {
      if (normalizedData[key] === "") normalizedData[key] = null;
    });
    // --- NEW: Fetch department and set employee_department ---
    try {
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("department")
        .eq("id", normalizedEmployeeId)
        .single();
      if (empErr || !emp?.department) {
        alert('[ERROR] Could not find department for this employee.');
        console.error('[DEBUG] Department fetch error:', empErr);
        return;
      }
      normalizedData.employee_department = emp.department;
      console.log('[DEBUG] Found employee department:', emp.department);
    } catch (fetchErr: any) {
      alert('[ERROR] Exception while fetching department: ' + (fetchErr.message || fetchErr));
      console.error('[DEBUG] Exception fetching department:', fetchErr);
      return;
    }
    // Now insert as before
    try {
      console.log('[DEBUG] Inserting bill with normalizedData:', normalizedData);
      const { error: insertErr } = await supabase.from("bills").insert([normalizedData]);
      if (insertErr) {
        alert('[ERROR] Failed to upload bill!: ' + insertErr.message);
        console.error('[DEBUG] Failed to upload bill:', insertErr.message);
        return;
      }
      alert('Bill submitted successfully!');
      console.log('[DEBUG] Bill submitted successfully');
      setFormData({
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
      setBalance(null);
      onBillSubmitted();
    } catch (err: any) {
      alert('[ERROR] Unexpected error during bill submission! ' + (err.message || err));
      console.error('[DEBUG] Unexpected error:', err.message || err);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Upload New Bill</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 bg-white shadow p-6 rounded-lg border"
      >
        {Object.keys(formData).map((field) => (
          <div key={field} className="col-span-1">
            <label className="block text-gray-700">
              {field.replace(/_/g, " ")}
            </label>
            {field === "item_category" ? (
              <select
                value={formData[field as keyof BillFormData]}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (field === "employee_id") {
                    setFormData({ ...formData, [field]: normalizeEmployeeId(raw) as any });
                  } else if (typeof raw === 'string') {
                    setFormData({ ...formData, [field]: raw });
                  } else {
                    setFormData({ ...formData, [field]: raw as any });
                  }
                }}
                className="w-full border p-2 rounded"
              >
                <option>Minor</option>
                <option>Major</option>
                <option>Consumables</option>
              </select>
            ) : (
              <input
                type={
                  field.includes("qty") || field.includes("value")
                    ? "number"
                    : "text"
                }
                value={formData[field as keyof BillFormData]}
                onChange={(e) =>
                  setFormData({ ...formData, [field]: e.target.value })
                }
                onWheel={field.includes("value") ? (e) => e.target.blur() : undefined}
                className="w-full border p-2 rounded"
                required={
                  field === "employee_id" || field === "employee_name"
                }
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