export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bills: {
        Row: {
          id: string
          employee_id: string | null
          po_details: string | null
          po_value: number | null
          supplier_name: string | null
          supplier_address: string | null
          item_category: string | null
          item_description: string | null
          qty: number | null
          bill_details: string | null
          indenter_name: string | null
          qty_issued: number | null
          source_of_fund: string | null
          stock_entry: string | null
          location: string | null
          remarks: string | null
          remarks1: string | null
          remarks2: string | null
          remarks3: string | null
          remarks4: string | null
          created_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          po_details?: string | null
          po_value?: number | null
          supplier_name?: string | null
          supplier_address?: string | null
          item_category?: string | null
          item_description?: string | null
          qty?: number | null
          bill_details?: string | null
          indenter_name?: string | null
          qty_issued?: number | null
          source_of_fund?: string | null
          stock_entry?: string | null
          location?: string | null
          remarks?: string | null
          remarks1?: string | null
          remarks2?: string | null
          remarks3?: string | null
          remarks4?: string | null
          created_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          po_details?: string | null
          po_value?: number | null
          supplier_name?: string | null
          supplier_address?: string | null
          item_category?: string | null
          item_description?: string | null
          qty?: number | null
          bill_details?: string | null
          indenter_name?: string | null
          qty_issued?: number | null
          source_of_fund?: string | null
          stock_entry?: string | null
          location?: string | null
          remarks?: string | null
          remarks1?: string | null
          remarks2?: string | null
          remarks3?: string | null
          remarks4?: string | null
          created_at?: string | null
          status?: string | null
        }
      }
      employees: {
        Row: {
          id: string
          email: string
          employee_type: string | null
          created_at: string | null
          employee_code: string | null
        }
        Insert: {
          id?: string
          email: string
          employee_type?: string | null
          created_at?: string | null
          employee_code?: string | null
        }
        Update: {
          id?: string
          email?: string
          employee_type?: string | null
          created_at?: string | null
          employee_code?: string | null
        }
      }
      pda_balances: {
        Row: {
          id: string
          employee_id: string | null
          balance: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          balance?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          balance?: number | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bill_status: 'User' | 'Student Purchase' | 'Audit' | 'Finance Admin' | 'Accepted'
      employee_type: 'Finance Admin' | 'Finance Employee' | 'Audit' | 'Student Purchase'
    }
  }
}

// Helper types
export type Bill = Database['public']['Tables']['bills']['Row']
export type BillInsert = Database['public']['Tables']['bills']['Insert']
export type BillUpdate = Database['public']['Tables']['bills']['Update']

export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type PDABalance = Database['public']['Tables']['pda_balances']['Row']
export type PDABalanceInsert = Database['public']['Tables']['pda_balances']['Insert']
export type PDABalanceUpdate = Database['public']['Tables']['pda_balances']['Update']

export type BillStatus = Database['public']['Enums']['bill_status']
export type EmployeeType = Database['public']['Enums']['employee_type']

// Extended types with relations
export type BillWithEmployee = Bill & {
  employees?: Employee | null
}

export type EmployeeWithPDABalance = Employee & {
  pda_balances?: PDABalance[]
}