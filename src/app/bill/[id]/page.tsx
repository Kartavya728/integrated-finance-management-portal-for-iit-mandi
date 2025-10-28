"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../utils/supabase/client";
import { Bill } from "../../apply-bill/types";

export default function BillDetailsPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setBill(data);
      } catch (err) {
        console.error("Error fetching bill:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBill();
  }, [id]);

  if (loading)
    return (
      <div className="text-center mt-10 text-gray-500">
        Loading bill details...
      </div>
    );

  if (!bill)
    return (
      <div className="text-center mt-10 text-gray-500">
        Bill not found.
      </div>
    );

  // helper for pretty formatting
  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === "NULL") return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "string" && val.trim() === "") return "—";
    return val;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6 mt-10 mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Bill Details
        </h2>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Print Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-sm">
        <p><strong>ID:</strong> {bill.id}</p>
        <p><strong>Employee ID:</strong> {formatValue(bill.employee_id)}</p>
        <p><strong>Employee Name:</strong> {formatValue(bill.employee_name)}</p>
        <p><strong>Department:</strong> {formatValue(bill.employee_department)}</p>
        <p><strong>PO Details:</strong> {formatValue(bill.po_details)}</p>
        <p><strong>PO Value:</strong> ₹{formatValue(bill.po_value)}</p>
        <p><strong>Supplier Name:</strong> {formatValue(bill.supplier_name)}</p>
        <p><strong>Supplier Address:</strong> {formatValue(bill.supplier_address)}</p>
        <p><strong>Item Category:</strong> {formatValue(bill.item_category)}</p>
        <p><strong>Item Description:</strong> {formatValue(bill.item_description)}</p>
        <p><strong>Quantity:</strong> {formatValue(bill.qty)}</p>
        <p><strong>Quantity Issued:</strong> {formatValue(bill.qty_issued)}</p>
        <p><strong>Indenter Name:</strong> {formatValue(bill.indenter_name)}</p>
        <p><strong>Bill Details:</strong> {formatValue(bill.bill_details)}</p>
        <p><strong>Source of Fund:</strong> {formatValue(bill.source_of_fund)}</p>
        <p><strong>Stock Entry:</strong> {formatValue(bill.stock_entry)}</p>
        <p><strong>Location:</strong> {formatValue(bill.location)}</p>
        <p><strong>Remarks:</strong> {formatValue(bill.remarks)}</p>
        <p><strong>Remarks1:</strong> {formatValue(bill.remarks1)}</p>
        <p><strong>Remarks2:</strong> {formatValue(bill.remarks2)}</p>
        <p><strong>Remarks3:</strong> {formatValue(bill.remarks3)}</p>
        <p><strong>Remarks4:</strong> {formatValue(bill.remarks4)}</p>
        <p><strong>Status:</strong> {formatValue(bill.status)}</p>
        <p><strong>SNP:</strong> {formatValue(bill.snp)}</p>
        <p><strong>Audit:</strong> {formatValue(bill.audit)}</p>
        <p><strong>Finance Admin:</strong> {formatValue(bill.finance_admin)}</p>
        <p><strong>Noted:</strong> {formatValue(bill.noted)}</p>
        <p><strong>Created At:</strong> {new Date(bill.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
