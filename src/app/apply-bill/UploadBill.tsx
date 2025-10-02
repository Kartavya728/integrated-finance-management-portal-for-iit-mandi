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

  // Robust PDA balance lookup (handles case/whitespace)
  const fetchPdaBalanceById = async (rawId: string) => {
    const id = normalizeEmployeeId(rawId);
    // 1) exact match
    let { data, error } = await supabase
      .from("pda_balances")
      .select("employee_id,balance")
      .eq("employee_id", id)
      .maybeSingle();
    if (data && !error) return data.balance as number | null;

    // 2) case-insensitive match
    const res2 = await supabase
      .from("pda_balances")
      .select("employee_id,balance")
      .ilike("employee_id", id)
      .maybeSingle();
    if (res2.data && !res2.error) return res2.data.balance as number | null;

    // 3) loose match (contains); then pick the exact trimmed match if exists
    const res3 = await supabase
      .from("pda_balances")
      .select("employee_id,balance")
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

    const billValue = parseFloat(String(formData.po_value).replace(/,/g, ""));

    // Required fields
    if (!formData.employee_id || !formData.employee_name) {
      alert("Employee ID and Name are required.");
      return;
    }

    if (isNaN(billValue) || billValue <= 0) {
      alert("Enter a valid bill amount.");
      return;
    }

    // Normalize identifiers
    const normalizedEmployeeId = normalizeEmployeeId(formData.employee_id);
    const normalizedEmployeeName = normalizeText(formData.employee_name);

    // Check PDA balance
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

    // Lookup employee department
    const { data: empData, error: empErr } = await supabase
      .from('employees')
      .select('department')
      .eq('id', normalizedEmployeeId)
      .single();

    if (empErr) {
      alert('Could not find employee department.');
      return;
    }

    // Normalize optional numeric fields
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
      qty_issued: formData.qty_issued ? parseInt(String(formData.qty_issued).replace(/,/g, "")) : null,
      item_category: category,
      snp,
      audit,
      status,
      finance_admin: status === "Finance Admin" && billValue <= 50000 ? "Pending" : null,
      employee_department: empData?.department || null,
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
      if (!normalizedData[field] || normalizedData[field] === "") {
        normalizedData[field] = null;
      }
    });

    try {
      // Deduct PDA balance
      const { error: updateErr } = await supabase
        .from("pda_balances")
        .update({ balance: currentBalance - billValue, updated_at: new Date() })
        .ilike("employee_id", normalizedEmployeeId);

      if (updateErr) {
        console.error("Error updating PDA balance:", updateErr.message);
        alert("Error updating PDA balance.");
        return;
      }

      // Insert bill
      const { error: insertErr } = await supabase.from("bills").insert([normalizedData]);

      if (insertErr) {
        console.error("Failed to upload bill:", insertErr.message);
        alert(`Failed to upload bill: ${insertErr.message}`);
        return;
      }

      alert("Bill submitted successfully!");
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
      console.error("Unexpected error:", err.message || err);
      alert("Something went wrong. Please try again.");
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
            <label className="block text-gray-700 capitalize">
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