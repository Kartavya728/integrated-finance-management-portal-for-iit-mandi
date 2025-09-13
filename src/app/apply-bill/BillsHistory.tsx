// BillsHistory.tsx
import React, { useState } from "react";
import { Bill } from "./types";
import EditBillModal from "./EditBillModal";

interface BillsHistoryProps {
  bills: Bill[];
  loading: boolean;
  onBillUpdated: () => void;
}

const BillsHistory: React.FC<BillsHistoryProps> = ({ 
  bills, 
  loading, 
  onBillUpdated 
}) => {
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const canEditBill = (bill: Bill) => {
    // Can only edit if status is "Hold" (not "Pending")
    return bill.snp === "Hold" || bill.audit === "Hold";
  };

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

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-6">All Bills History</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-semibold mb-6">All Bills History</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No bills uploaded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-6">All Bills History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border rounded bg-white shadow-sm text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Details
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Value
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SNP
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Audit
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bill.employee_id}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {bill.employee_name}
                </td>
                <td className="px-3 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {bill.po_details || "N/A"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹ {bill.po_value?.toLocaleString()}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {bill.item_category}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  {bill.snp ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.snp)}`}>
                      {bill.snp}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  {bill.audit ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.audit)}`}>
                      {bill.audit}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(bill.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                  {canEditBill(bill) ? (
                    <button
                      onClick={() => setEditingBill(bill)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <span className="text-gray-400 px-3 py-1">
                      {bill.snp === "Pending" || bill.audit === "Pending" ? "Pending" : "Locked"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onBillUpdated={onBillUpdated}
        />
      )}
    </div>
  );
};

export default BillsHistory;