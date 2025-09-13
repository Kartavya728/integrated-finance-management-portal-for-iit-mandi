// types.ts
export interface Bill {
  id: string;
  employee_id: string;
  employee_name: string;
  po_details: string | null;
  po_value: number | null;
  supplier_name: string | null;
  supplier_address: string | null;
  item_category: string | null;
  item_description: string | null;
  qty: number | null;
  bill_details: string | null;
  indenter_name: string | null;
  qty_issued: number | null;
  source_of_fund: string | null;
  stock_entry: string | null;
  location: string | null;
  created_at: string;
  status: string;
  snp: "Pending" | "Reject" | "Hold" | "Approved" | "NULL";
  audit: "Pending" | "Reject" | "Hold" | "Approved" | "NULL";
  finance_admin: string | null;
}

export interface BillFormData {
  employee_id: string;
  employee_name: string;
  po_details: string;
  po_value: string;
  supplier_name: string;
  supplier_address: string;
  item_category: string;
  item_description: string;
  qty: string;
  bill_details: string;
  indenter_name: string;
  qty_issued: string;
  source_of_fund: string;
  stock_entry: string;
  location: string;
}