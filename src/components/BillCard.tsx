import React from 'react';
import { Bill } from '@/types/database';

interface BillCardProps {
  bill: Bill;
  showBankGuarantee?: boolean;
  className?: string;
}

export const BillCard: React.FC<BillCardProps> = ({ 
  bill, 
  showBankGuarantee = true,
  className = ''
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `₹${amount.toLocaleString()}`;
  };


 const handlePrintBill = () => {
  const printContent = `
    <html>
      <head>
        <title>Bill ${bill.id}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
            zoom: 85%;
          }

          h2 {
            text-align: center;
            margin-bottom: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }

          td, th {
            border: 1px solid #555;
            padding: 6px;
            text-align: left;
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <h2>Bill Details</h2>
        <table>
          <tr><td>ID</td><td>${bill.id}</td></tr>
          <tr><td>Employee ID</td><td>${bill.employee_id}</td></tr>
          <tr><td>Employee Name</td><td>${bill.employee_name}</td></tr>
          <tr><td>Department</td><td>${bill.employee_department}</td></tr>
          <tr><td>PO Details</td><td>${bill.po_details}</td></tr>
          <tr><td>PO Value</td><td>${bill.po_value ? "₹" + bill.po_value : "—"}</td></tr>
          <tr><td>Supplier Name</td><td>${bill.supplier_name}</td></tr>
          <tr><td>Supplier Address</td><td>${bill.supplier_address}</td></tr>
          <tr><td>Item Category</td><td>${bill.item_category}</td></tr>
          <tr><td>Item Description</td><td>${bill.item_description}</td></tr>
          <tr><td>Quantity</td><td>${bill.qty}</td></tr>
          <tr><td>Quantity Issued</td><td>${bill.qty_issued}</td></tr>
          <tr><td>Indenter Name</td><td>${bill.indenter_name}</td></tr>
          <tr><td>Bill Details</td><td>${bill.bill_details}</td></tr>
          <tr><td>Source of Fund</td><td>${bill.source_of_fund}</td></tr>
          <tr><td>Stock Entry</td><td>${bill.stock_entry}</td></tr>
          <tr><td>Location</td><td>${bill.location}</td></tr>
          <tr><td>Remarks</td><td>${bill.remarks}</td></tr>
          <tr><td>Remarks1</td><td>${bill.remarks1}</td></tr>
          <tr><td>Remarks2</td><td>${bill.remarks2}</td></tr>
          <tr><td>Remarks3</td><td>${bill.remarks3}</td></tr>
          <tr><td>Remarks4</td><td>${bill.remarks4}</td></tr>
          <tr><td>Status</td><td>${bill.status}</td></tr>
          <tr><td>SNP</td><td>${bill.snp}</td></tr>
          <tr><td>Audit</td><td>${bill.audit}</td></tr>
          <tr><td>Finance Admin</td><td>${bill.finance_admin}</td></tr>
          <tr><td>Noted</td><td>${bill.noted}</td></tr>
          <tr><td>Created At</td><td>${new Date(bill.created_at).toLocaleString()}</td></tr>
        </table>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };


  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      {/* Basic Bill Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {bill.item_description || "No description"}
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Supplier:</span> {bill.supplier_name || "N/A"}</p>
            <p><span className="font-medium">Amount:</span> {formatCurrency(bill.po_value)}</p>
            <p><span className="font-medium">Category:</span> {bill.item_category || "N/A"}</p>
            <p><span className="font-medium">Status:</span> {bill.status || "N/A"}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Purchase Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">PO:</span> {bill.po_details || "N/A"}</p>
            <p><span className="font-medium">Quantity:</span> {bill.qty || 0}</p>
            <p><span className="font-medium">Indenter:</span> {bill.indenter_name || "N/A"}</p>
            <p><span className="font-medium">Location:</span> {bill.location || "N/A"}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Workflow Status</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">SNP:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                bill.snp === 'Approved' ? 'bg-green-100 text-green-800' :
                bill.snp === 'Reject' ? 'bg-red-100 text-red-800' :
                bill.snp === 'Hold' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {bill.snp || 'Pending'}
              </span>
            </p>
            <p>
              <span className="font-medium">Audit:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                bill.audit === 'Approved' ? 'bg-green-100 text-green-800' :
                bill.audit === 'Reject' ? 'bg-red-100 text-red-800' :
                bill.audit === 'Hold' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {bill.audit || 'Pending'}
              </span>
            </p>
            <p>
              <span className="font-medium">Finance:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                bill.finance_admin === 'Approved' ? 'bg-green-100 text-green-800' :
                bill.finance_admin === 'Reject' ? 'bg-red-100 text-red-800' :
                bill.finance_admin === 'Hold' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {bill.finance_admin || 'Pending'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bank Guarantee Information */}
      {showBankGuarantee && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Bank Guarantee Information
          </h4>
          
          {bill.has_bank_guarantee ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-purple-50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-800">Bank Guarantee</p>
                <p className="text-sm text-green-700 font-medium">✅ Required</p>
              </div>
              
              {bill.bank_guarantee_details && (
                <div className="md:col-span-1">
                  <p className="text-sm font-medium text-purple-800">Details</p>
                  <p className="text-sm text-gray-700">{bill.bank_guarantee_details}</p>
                </div>
              )}
              
              {bill.bank_guarantee_amount && (
                <div>
                  <p className="text-sm font-medium text-purple-800">Amount</p>
                  <p className="text-sm text-gray-700">{formatCurrency(bill.bank_guarantee_amount)}</p>
                </div>
              )}
              
              {bill.date_of_installation && (
                <div>
                  <p className="text-sm font-medium text-purple-800">Installation Date</p>
                  <p className="text-sm text-gray-700">{formatDate(bill.date_of_installation)}</p>
                </div>
              )}
              
              {bill.date_of_delivery && (
                <div>
                  <p className="text-sm font-medium text-purple-800">Delivery Date</p>
                  <p className="text-sm text-gray-700">{formatDate(bill.date_of_delivery)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No bank guarantee required for this bill
              </p>
            </div>
          )}
        </div>
      )}

      {/* Additional Remarks */}
      {(bill.remarks1 || bill.remarks2 || bill.remarks3 || bill.remarks4) && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-gray-700 mb-3">Remarks</h4>
          <div className="space-y-2">
            {bill.remarks1 && (
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm font-medium text-purple-800">SNP Remark</p>
                <p className="text-sm text-purple-700">{bill.remarks1}</p>
              </div>
            )}
            {bill.remarks2 && (
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm font-medium text-green-800">Audit Remark</p>
                <p className="text-sm text-green-700">{bill.remarks2}</p>
              </div>
            )}
            {bill.remarks3 && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-medium text-blue-800">Finance Admin Remark</p>
                <p className="text-sm text-blue-700">{bill.remarks3}</p>
              </div>
            )}
            {bill.remarks4 && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-800">Additional Remark</p>
                <p className="text-sm text-gray-700">{bill.remarks4}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handlePrintBill}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          Print Bill
        </button>
      </div>

    </div>
  );
};

export default BillCard;