import React from "react";
import { cn } from "@/lib/utils";

interface Bill {
  id: string;
  po_details: string;
  supplier_name: string;
  po_value: number;
  status: string;
  stage?: string;
  remarks?: string;
  created_at?: string;
}

const statusColors: Record<string, string> = {
  pending: "border-yellow-500 text-yellow-700",
  approved: "border-green-600 text-green-700",
  verified: "border-green-600 text-green-700",
  rejected: "border-red-600 text-red-700",
  hold: "border-orange-600 text-orange-700",
  default: "border-gray-400 text-gray-600",
};

export default function BillCard({ bill }: { bill: Bill }) {
  const colorClass =
    statusColors[bill.status?.toLowerCase()] || statusColors.default;

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-white p-4 shadow-sm hover:shadow-md transition",
        colorClass
      )}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {bill.po_details || bill.supplier_name || "Untitled Bill"}
        </h3>
        <span className="text-sm text-gray-500">
          {bill.created_at
            ? new Date(bill.created_at).toLocaleDateString()
            : ""}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        Amount: <span className="font-medium">₹ {bill.po_value}</span>
      </p>

      <p className="text-sm mb-2">
        Status:{" "}
        <span className="font-semibold capitalize">{bill.status}</span>
      </p>

      {bill.status === "pending" && bill.stage && (
        <p className="text-sm text-yellow-700">
          Currently pending at <strong>{bill.stage}</strong>
        </p>
      )}

      {bill.status === "hold" && bill.remarks && (
        <p className="mt-2 text-sm text-orange-700 italic">
          Remark: {bill.remarks}
        </p>
      )}
    </div>
  );
}
