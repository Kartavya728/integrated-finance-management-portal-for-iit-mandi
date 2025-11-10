import { BillUpdateEmailData } from './mailer';
import { supabase } from '../app/utils/supabase/client';

export interface BillRemarkData {
  billId: string;
  department: string;
  remark: string;
  action: 'Hold' | 'Reject' | 'Approved';
  timestamp: string;
}

export const sendBillRemarkNotification = async (remarkData: BillRemarkData) => {
  try {

    // Get bill details and employee information
    const { data: billData, error: billError } = await (supabase as any)
      .from('bills')
      .select(`
        id,
        employee_id,
        employee_name,
        po_details,
        supplier_name,
        po_value,
        item_description,
        remarks,
        remarks1,
        remarks2,
        remarks3,
        remarks4,
        snp,
        audit,
        finance_admin
      `)
      .eq('id', remarkData.billId)
      .single();

    if (billError || !billData) {
      console.error('Error fetching bill data:', billError);
      return;
    }

    // Get employee email
    const { data: employeeData, error: employeeError } = await (supabase as any)
      .from('pda_balances')
      .select('email')
      
      .or(
        [
          `employee_id.eq.${billData.employee_id}`,
          `employee_id.like.%${billData.employee_id}%`,
          `employee_id.like.%${billData.employee_id}`,
          `employee_id.like.${billData.employee_id}%`
        ].join(",")
      )
      .single();

    if (employeeError || !employeeData?.email) {
      console.error('Error fetching employee email:', employeeError);
      return;
    }

    // Do not include previous remarks in the email
  const previousRemarks: Array<{ department: string; remark: string; timestamp?: string }> = [];

    // Prepare email data
    const emailData: BillUpdateEmailData = {
      billId: billData.id,
      employeeEmail: employeeData.email,
      employeeName: billData.employee_name || 'Unknown',
      recentRemark: {
        department: remarkData.department,
        remark: remarkData.remark,
        timestamp: remarkData.timestamp,
        action: remarkData.action
      },
      previousRemarks,
      billDetails: {
        poDetails: billData.po_details || 'N/A',
        supplierName: billData.supplier_name || 'N/A',
        amount: billData.po_value || 0,
        itemDescription: billData.item_description || 'N/A'
      }
    };

    // Send email via API route
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email API error:', errorData);
      throw new Error(`Email API failed: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log(`Email sent successfully for bill ${remarkData.billId}`, result);
    
  } catch (error) {
    console.error('Error in sendBillRemarkNotification:', error);
  }
};
