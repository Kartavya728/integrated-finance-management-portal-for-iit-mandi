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
        const { data, error } = await supabase
          .from("pda_balances")
          .select("balance")
          .eq("employee_id", bill.employee_id)
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
  }, [bill.employee_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newBillValue = parseFloat(formData.po_value);

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

    // Determine category, snp, audit based on new value
    let category = formData.item_category;
    let snp: "Pending" | "Reject" | "Hold" | "Approved" | null = null;
    let audit: "Pending" | "Reject" | "Hold" | "Approved" | null = null;

    if (newBillValue > 50000) {
      if (category === "Minor") {
        alert("Bills greater than ₹50,000 cannot be Minor.");
        setLoading(false);
        return;
      }
      snp = "Pending";
      audit = null;
    } else {
      category = "Minor";
      snp = null;
      audit = "Pending";
    }

    // Normalize the data
    const normalizedData: any = {
      ...formData,
      po_value: newBillValue,
      qty: formData.qty ? parseInt(formData.qty.toString()) : null,
      qty_issued: formData.qty_issued ? parseInt(formData.qty_issued.toString()) : null,
      item_category: category,
      snp,
      audit,
      status: "User", // Reset status back to User when edited
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
        const { error: updateErr } = await supabase
          .from("pda_balances")
          .update({ balance: newBalance, updated_at: new Date() })
          .eq("employee_id", bill.employee_id);

        if (updateErr) {
          console.error("Error updating PDA balance:", updateErr.message);
          alert("Error updating PDA balance.");
          setLoading(false);
          return;
        }
      }

      // Update the bill
      const { error: updateBillErr } = await supabase
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
                <label className="block text-gray-700 capitalize font-medium mb-1">
                  {field.replace(/_/g, " ")}
                  {(field === "employee_id" || field === "employee_name") && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                {field === "item_category" ? (
                  <select
                    value={formData[field as keyof BillFormData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
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