
export interface BillUpdateEmailData {
  billId: string;
  employeeEmail: string;
  employeeName: string;
  recentRemark: {
    department: string;
    remark: string;
    timestamp: string;
    action: 'Hold' | 'Reject' | 'Approved';
  };
  previousRemarks: Array<{
    department: string;
    remark: string;
    timestamp?: string;
  }>;
  billDetails: {
    poDetails: string;
    supplierName: string;
    amount: number;
    itemDescription: string;
  };
}

export function getBillUpdateEmailContent(emailData: BillUpdateEmailData) {
  const { billId, employeeEmail, employeeName, recentRemark, previousRemarks, billDetails } = emailData;
  const subject = `Update on Bill`;
  let previousRemarksHtml = '';
  if (previousRemarks.length > 0) {
    previousRemarksHtml = '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">';
    previousRemarksHtml += '<h3 style="color: #555; margin-top: 0;">Previous Remarks</h3>';
    previousRemarks.forEach(remark => {
      previousRemarksHtml += '<div style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 3px; border-left: 3px solid #2196F3;">';
      previousRemarksHtml += `<p style="margin: 0;"><strong>${remark.department}:</strong> ${remark.remark}</p>`;
      if (remark.timestamp) {
        previousRemarksHtml += `<p style="margin: 5px 0 0 0; font-size: 0.9em; color: #666;">${remark.timestamp}</p>`;
      }
      previousRemarksHtml += '</div>';
    });
    previousRemarksHtml += '</div>';
  }

  const html =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
    '<h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">' +
    'Bill Update Notification' +
    '</h2>' +
    '<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">' +
    '<h3 style="color: #555; margin-top: 0;">Bill Details</h3>' +
    `<p><strong>Bill ID:</strong> ${billId}</p>` +
    `<p><strong>PO Details:</strong> ${billDetails.poDetails}</p>` +
    `<p><strong>Supplier:</strong> ${billDetails.supplierName}</p>` +
    `<p><strong>Amount:</strong> ₹${billDetails.amount.toLocaleString()}</p>` +
    `<p><strong>Description:</strong> ${billDetails.itemDescription}</p>` +
    '</div>' +
    '<div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">' +
    '<h3 style="color: #2e7d32; margin-top: 0;">Recent Update</h3>' +
    `<p><strong>Department:</strong> ${recentRemark.department}</p>` +
    `<p><strong>Action:</strong> ${recentRemark.action}</p>` +
    `<p><strong>Remark:</strong> ${recentRemark.remark}</p>` +
    `<p><strong>Time:</strong> ${recentRemark.timestamp}</p>` +
    '</div>' +
    previousRemarksHtml +
    '<div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px;">' +
    '<p style="margin: 0; color: #1976d2;">' +
    '<strong>Note:</strong> This is an automated notification regarding your bill submission. ' +
    'Please check the portal for more details.' +
    '</p>' +
    '</div>' +
    '</div>';
  return { subject, html };
}
