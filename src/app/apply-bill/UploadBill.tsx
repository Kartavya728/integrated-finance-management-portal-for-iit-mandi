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

  // Fetch PDA balance when employee_id changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!formData.employee_id) return;
      try {
        const { data, error } = await supabase
          .from("pda_balances")
          .select("balance")
          .eq("employee_id", formData.employee_id)
          .single();
        if (error) {
          console.error("Error fetching PDA balance:", error.message);
          setBalance(null);
        } else {
          setBalance(data?.balance || 0);
        }
      } catch (err) {
        console.error(err);
        setBalance(null);
      }
    };
    fetchBalance();
  }, [formData.employee_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const billValue = parseFloat(formData.po_value);

    // Required fields
    if (!formData.employee_id || !formData.employee_name) {
      alert("Employee ID and Name are required.");
      return;
    }

    if (isNaN(billValue) || billValue <= 0) {
      alert("Enter a valid bill amount.");
      return;
    }

    // Check PDA balance
    const { data: balanceData, error: balanceErr } = await supabase
      .from("pda_balances")
      .select("balance")
      .eq("employee_id", formData.employee_id)
      .single();

    if (balanceErr || !balanceData) {
      alert("Invalid Employee ID or no PDA balance found.");
      return;
    }

    const currentBalance = parseFloat(balanceData.balance);
    if (currentBalance < billValue) {
      alert("Insufficient PDA balance. Cannot submit bill.");
      return;
    }

    // Determine category, snp, audit
    let category = formData.item_category;
    let snp: "Pending" | "Reject" | "Hold" | "Approved" | null = null;
    let audit: "Pending" | "Reject" | "Hold" | "Approved" | null = null;

    if (billValue > 50000) {
      if (category === "Minor") {
        alert("Bills greater than ₹50,000 cannot be Minor.");
        return;
      }
      snp = "Pending";
      audit = null;
    } else {
      category = "Minor";
      snp = null;
      audit = "Pending";
    }

    // Lookup employee department
    const { data: empData, error: empErr } = await supabase
      .from('employees')
      .select('department')
      .eq('id', formData.employee_id)
      .single();

    if (empErr) {
      alert('Could not find employee department.');
      return;
    }

    // Normalize optional numeric fields
    const normalizedData: any = {
      ...formData,
      po_value: billValue,
      qty: formData.qty ? parseInt(formData.qty.toString()) : null,
      qty_issued: formData.qty_issued ? parseInt(formData.qty_issued.toString()) : null,
      item_category: category,
      snp,
      audit,
      status: "User",
      finance_admin: null,
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
        .eq("employee_id", formData.employee_id);

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
                onChange={(e) =>
                  setFormData({ ...formData, [field]: e.target.value })
                }
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