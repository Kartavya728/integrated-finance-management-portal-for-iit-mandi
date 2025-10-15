"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../utils/supabase/client";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";

interface Bill {
  id: string;
  po_details: string;
  supplier_name: string;
  po_value: number;
  status: string;
  employee_name: string;
  item_description?: string;
  item_category?: string;
  qty?: number;
}

export default function BillPage() {
  const params = useParams();
  const billId = params.id;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;

    const fetchBill = async () => {
      try {
        const { data } = await supabase
          .from("bills")
          .select("*")
          .eq("id", billId)
          .single();

        setBill(data);
      } catch (err) {
        console.error("Error fetching bill:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!bill) return <div className="p-6 text-red-600">Bill not found!</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-4"
      >
        Bill Details
      </motion.h1>

      <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow">
        <p><strong>Bill ID:</strong> {bill.id}</p>
        <p><strong>Employee:</strong> {bill.employee_name}</p>
        <p><strong>PO Details:</strong> {bill.po_details}</p>
        <p><strong>Supplier:</strong> {bill.supplier_name}</p>
        <p><strong>Item:</strong> {bill.item_description || "N/A"}</p>
        <p><strong>Category:</strong> {bill.item_category || "N/A"}</p>
        <p><strong>Quantity:</strong> {bill.qty || 0}</p>
        <p><strong>Amount:</strong> ₹{bill.po_value?.toLocaleString() || 0}</p>
        <p><strong>Status:</strong> {bill.status}</p>
      </div>

    </div>
  );
}
