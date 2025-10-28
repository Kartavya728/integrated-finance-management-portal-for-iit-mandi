"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase/client";
import QRCode from "react-qr-code";
import { Bill } from "./types";

interface ApprovedBillsProps {
  department: string | null;
}

const ApprovedBills: React.FC<ApprovedBillsProps> = ({ department }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!department) {
      setLoading(false);
      return;
    }

    const fetchApprovedBills = async () => {
      setLoading(true);
      try {
        // Fetch only bills where all three departments have approved
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_department", department)
          .eq("snp", "Approved")
          .eq("audit", "Approved")
          .eq("finance_admin", "Approved")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching approved bills:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedBills();
  }, [department]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "text-yellow-600 bg-yellow-100";
      case "Approved":
        return "text-green-600 bg-green-100";
      case "Reject":
        return "text-red-600 bg-red-100";
      case "Hold":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const handlePrintQR = (billId: string) => {
    const qrElement = document.getElementById(`qr-${billId}`);
    if (!qrElement) return;

    const qrContent = qrElement.outerHTML;
    const printWindow = window.open("", "_blank");
    printWindow?.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; }
          </style>
        </head>
        <body>
          ${qrContent}
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-6">Approved Bills</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-6">Approved Bills</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No approved bills found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-6">Approved Bills</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border rounded bg-white shadow-sm text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Details</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Value</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SNP</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audit</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finance Admin</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{bill.employee_id}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{bill.employee_name}</td>
                <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate">{bill.po_details || "N/A"}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">₹ {bill.po_value?.toLocaleString()}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{bill.item_category || "—"}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.snp)}`}>{bill.snp}</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.audit)}`}>{bill.audit}</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.finance_admin)}`}>{bill.finance_admin}</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(bill.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                  <div id={`qr-${bill.id}`} className="flex flex-col items-center gap-2">
                    <QRCode
                      size={64}
                      value={`${window.location.origin}/bill/${bill.id}`}
                    />
                    <button
                      onClick={() => handlePrintQR(bill.id)}
                      className="text-blue-600 text-xs underline hover:text-blue-800"
                    >
                      Print QR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApprovedBills;