"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function FinanceForm() {
  const supabase = createClientComponentClient();
  const [formData, setFormData] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("finance_items").insert([formData]);
    if (error) {
      console.error("Insert Error:", error.message);
      alert("Error saving data");
    } else {
      alert("Data saved successfully!");
      setFormData({});
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md"
    >
      <input
        type="number"
        placeholder="Sr. No"
        name="sr_no"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="PO Details"
        name="po_details"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="date"
        placeholder="PO Date"
        name="po_date"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="number"
        placeholder="Purchase Order Value Rs."
        name="purchase_order_value"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Supplier Name"
        name="supplier_name"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Supplier Address"
        name="supplier_address"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Item Category"
        name="item_category"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <textarea
        placeholder="Item Description"
        name="item_description"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="number"
        placeholder="Qty"
        name="qty"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Bill No."
        name="bill_no"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="date"
        placeholder="Bill Date"
        name="bill_date"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="number"
        placeholder="Bill Value"
        name="bill_value"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Indenter Name"
        name="indenter_name"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        type="number"
        placeholder="Qty Issued"
        name="qty_issued"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Source of Fund"
        name="source_of_fund"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Stock Entry (Register/Page/S.No)"
        name="stock_entry"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <input
        placeholder="Location"
        name="location"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />
      <textarea
        placeholder="Remarks"
        name="remarks"
        onChange={handleChange}
        className="w-full border rounded-lg p-2"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Save
      </button>
    </form>
  );
}
