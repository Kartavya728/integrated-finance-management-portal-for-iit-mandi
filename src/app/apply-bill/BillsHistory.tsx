// BillsHistory.tsx
import React, { useState } from "react";
import { supabase } from "../utils/supabase/client";
import { Bill } from "./types";
import EditBillModal from "./EditBillModal";

interface BillsHistoryProps {
  bills: Bill[];
  loading: boolean;
  onBillUpdated: () => void;
  alwaysEditable?: boolean; // if true, show Edit for all rows
  allowDelete?: boolean;    // if true, show Delete for each row
  enableEdit?: boolean;     // if false, hide Edit UI completely
  onBillNoted?: (billId: string) => void; // Callback when a bill is noted
}

const BillsHistory: React.FC<BillsHistoryProps> = ({ 
  bills, 
  loading, 
  onBillUpdated,
  alwaysEditable = false,
  allowDelete = false,
  enableEdit = true,
  onBillNoted,
}) => {
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [notingId, setNotingId] = useState<string | null>(null);

  const canEditBill = (bill: Bill) => {
    if (alwaysEditable) return true;
    // Otherwise only when on hold in any dept
    return bill.snp === "Hold" || bill.audit === "Hold";
  };

  const handleNoted = async (billId: string) => {
    if (!allowDelete || !onBillNoted) return;
    const confirmed = window.confirm("Mark this bill as noted? It will be permanently removed from your view.");
    if (!confirmed) return;
    try {
      setNotingId(billId);
      // Update the bill in database to mark as noted
      const { error } = await (supabase.from("bills") as any)
        .update({ noted: true })
        .eq("id", billId);
      
      if (error) {
        console.error("Error updating bill as noted:", error);
        alert("Error marking bill as noted");
        return;
      }
      
      // Call the callback to remove the bill from the current view
      onBillNoted(billId);
    } catch (err) {
      console.error("Error noting bill:", err);
      alert("Error noting bill");
    } finally {
      setNotingId(null);
    }
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
      <h2 className="text-2xl font-semibold mb-6">Rejected Bills</h2>
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
                Finance Admin
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              {enableEdit && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edit
                </th>
              )}
              {allowDelete && (
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Noted
                </th>
              )}
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
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  {bill.finance_admin ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bill.finance_admin)}`}>
                      {bill.finance_admin}
                    </span>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(bill.created_at).toLocaleDateString()}
                </td>
                {enableEdit && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingBill(bill)}
                      disabled={!canEditBill(bill)}
                      className={`inline-flex items-center px-3 py-1 rounded-md transition-colors ${
                        canEditBill(bill)
                          ? "text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100"
                          : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      }`}
                    >
                      Edit
                    </button>
                  </td>
                )}
                {allowDelete && (
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleNoted(bill.id)}
                      disabled={notingId === bill.id}
                      className="inline-flex items-center px-3 py-1 rounded-md transition-colors disabled:opacity-50 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100"
                    >
                      {notingId === bill.id ? "Noting..." : "Noted"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enableEdit && editingBill && (
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