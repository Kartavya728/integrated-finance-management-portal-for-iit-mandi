// EditBillModal.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { Bill, BillFormData } from "./types";

interface EditBillModalProps {
  bill: Bill;
  onClose: () => void;
  onBillUpdated: () => void;
}

const EditBillModal: React.FC<EditBillModalProps> = ({ 
  bill, 
  onClose, 
  onBillUpdated 
}) => {
  const [formData, setFormData] = useState<BillFormData>({
    employee_id: bill.employee_id,
    employee_name: bill.employee_name,
    po_details: bill.po_details || "",
    po_value: bill.po_value?.toString() || "",
    supplier_name: bill.supplier_name || "",
    supplier_address: bill.supplier_address || "",
    item_category: bill.item_category || "Minor",
    item_description: bill.item_description || "",
    qty: bill.qty?.toString() || "",
    bill_details: bill.bill_details || "",
    indenter_name: bill.indenter_name || "",
    qty_issued: bill.qty_issued?.toString() || "",
    source_of_fund: bill.source_of_fund || "",
    stock_entry: bill.stock_entry || "",
    location: bill.location || "",
  });
  
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [originalBillValue] = useState(bill.po_value || 0);

  // Fetch current PDA balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const normalizedId = (bill.employee_id || "").toString().trim().toUpperCase();
        // 1) Exact match → get first row
        let { data, error } = await supabase
          .from("pda_balances")
          .select("employee_id,balance")
          .eq("employee_id", normalizedId)
          .order("updated_at", { ascending: false })
          .limit(1);

        let balanceValue: number | null = null;
        if (!error && Array.isArray(data) && data.length > 0) {
          balanceValue = Number((data as any)[0]?.balance ?? null);
        }

        // 2) Case-insensitive fallback
        if ((error || balanceValue === null)) {
          const res = await supabase
            .from("pda_balances")
            .select("employee_id,balance")
            .ilike("employee_id", normalizedId)
            .order("updated_at", { ascending: false })
            .limit(1);
          if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
            balanceValue = Number((res.data as any)[0]?.balance ?? null);
          }
          error = res.error as any;
        }

        // 3) Loose contains fallback (handles stray spaces or prefixes)
        if ((error || balanceValue === null)) {
          const res2 = await supabase
            .from("pda_balances")
            .select("employee_id,balance")
            .ilike("employee_id", `%${normalizedId}%`)
            .order("updated_at", { ascending: false })
            .limit(1);
          if (!res2.error && Array.isArray(res2.data) && res2.data.length > 0) {
            balanceValue = Number((res2.data as any)[0]?.balance ?? null);
          }
          error = res2.error as any;
        }

        if (error && !balanceValue) {
          console.error("Error fetching PDA balance:", error.message);
          setBalance(null);
        } else {
          setBalance(Number.isFinite(balanceValue as number) ? (balanceValue as number) : 0);
        }
      } catch (err) {
        console.error(err);
        setBalance(null);
      }
    };
    fetchBalance();
  }, [bill.employee_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newBillValue = parseFloat(formData.po_value);

    // ENFORCE 50k THRESHOLD SIDE on amount edit
    const wasAbove50k = originalBillValue > 50000;
    const isAbove50k = newBillValue > 50000;
    if (wasAbove50k !== isAbove50k) {
      alert(
        originalBillValue <= 50000
          ? "New amount must remain ≤ 50,000 since the original was ≤ 50,000."
          : "New amount must remain > 50,000 since the original was > 50,000."
      );
      setLoading(false);
      return;
    }

    // Validation
    if (!formData.employee_id || !formData.employee_name) {
      alert("Employee ID and Name are required.");
      setLoading(false);
      return;
    }

    if (isNaN(newBillValue) || newBillValue <= 0) {
      alert("Enter a valid bill amount.");
      setLoading(false);
      return;
    }

    // Check if we have sufficient balance for the difference
    if (balance !== null) {
      const balanceDifference = newBillValue - originalBillValue;
      if (balanceDifference > 0 && balance < balanceDifference) {
        alert("Insufficient PDA balance for the increased amount.");
        setLoading(false);
        return;
      }
    }

    // Prepare workflow stage update
    let snp = bill.snp;
    let audit = bill.audit;
    let finance_admin = bill.finance_admin;

    if (bill.snp === 'Hold') {
      snp = 'Pending';
    } else if (bill.audit === 'Hold') {
      audit = 'Pending';
    } else if (bill.finance_admin === 'Hold') {
      finance_admin = 'Pending';
    }

    // Normalize fields; only update hold-to-pending status
    const normalizedData: any = {
      ...formData,
      po_value: newBillValue,
      qty: formData.qty ? parseInt(formData.qty.toString()) : null,
      qty_issued: formData.qty_issued ? parseInt(formData.qty_issued.toString()) : null,
      snp,
      audit,
      finance_admin,
    };

    // Normalize empty strings to null
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
      // Update PDA balance if bill value changed
      const balanceDifference = newBillValue - originalBillValue;
      if (balanceDifference !== 0 && balance !== null) {
        const newBalance = balance - balanceDifference;
        const { error: updateErr } = await (supabase as any)
          .from("pda_balances")
          .update({ balance: Number(newBalance), updated_at: new Date().toISOString() })
          .eq("employee_id", bill.employee_id);

        if (updateErr) {
          console.error("Error updating PDA balance:", updateErr.message);
          alert("Error updating PDA balance.");
          setLoading(false);
          return;
        }
      }

      // Update the bill
      const { error: updateBillErr } = await (supabase as any)
        .from("bills")
        .update(normalizedData)
        .eq("id", bill.id);

      if (updateBillErr) {
        console.error("Failed to update bill:", updateBillErr.message);
        alert(`Failed to update bill: ${updateBillErr.message}`);
        setLoading(false);
        return;
      }

      alert("Bill updated successfully!");
      onBillUpdated();
      onClose();
    } catch (err: any) {
      console.error("Unexpected error:", err.message || err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Edit Bill</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.keys(formData).map((field) => (
              <div key={field} className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">
                  {field.replace(/_/g, " ")}
                  {(field === "employee_id" || field === "employee_name") && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                {field === "item_category" ? (
                  <div className="w-full p-2 rounded border border-gray-200 bg-gray-50 text-gray-800 select-none cursor-not-allowed">
                    {formData[field as keyof BillFormData]}
                  </div>
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
                    onWheel={field.includes("value") ? (e) => (e.target as HTMLInputElement).blur() : undefined}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={
                      field === "employee_id" || field === "employee_name"
                    }
                    disabled={
                      loading || 
                      field === "employee_id" || 
                      field === "employee_name"
                    }
                  />
                )}
              </div>
            ))}
          </div>

          {balance !== null && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p>Current PDA Balance: ₹ {balance.toFixed(2)}</p>
                <p>Original Bill Value: ₹ {originalBillValue.toFixed(2)}</p>
                {parseFloat(formData.po_value) !== originalBillValue && (
                  <p className="font-medium">
                    Balance after update: ₹ {(balance - (parseFloat(formData.po_value) - originalBillValue)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Bill"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditBillModal;