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
          snp: string | null
          audit: string | null
          finance_admin: string | null
          employee_department: string | null
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
          snp?: string | null
          audit?: string | null
          finance_admin?: string | null
          employee_department?: string | null
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
          snp?: string | null
          audit?: string | null
          finance_admin?: string | null
          employee_department?: string | null
        }
      }
      employees: {
        Row: {
          id: string
          email: string
          employee_type: string | null
          created_at: string | null
          employee_code: string | null
          department: string
        }
        Insert: {
          id?: string
          email: string
          employee_type?: string | null
          created_at?: string | null
          employee_code?: string | null
          department: string
        }
        Update: {
          id?: string
          email?: string
          employee_type?: string | null
          created_at?: string | null
          employee_code?: string | null
          department?: string
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
      employee_type: 'Finance Admin' | 'Finance Employee' | 'Audit' | 'Student Purchase|bill_employee_edit|bill_employee_fill'
      department:
        | 'Staff Recruitment Section'
        | 'Dean Infrastructure (I&S)/Land Acquisition'
        | 'Dean Resource Generation & Alumni Relations'
        | 'Central Dak Section'
        | 'Health Center'
        | 'School of Computing & Electrical Engineering'
        | 'School of Chemical Sciences'
        | 'School of Physical Sciences'
        | 'School of Mathematical & Statistical Sciences'
        | 'School of Biosciences & Bio Engineering'
        | 'School of Mechanical & Materials Engineering'
        | 'School of Civil & Environmental Engineering'
        | 'School of Humanities & Social Sciences'
        | 'School of Management'
        | 'Advanced Materials Research Center (AMRC)'
        | 'Centre of Artificial Intelligence and Robotics (CAIR)'
        | 'Center for Quantum Science and Technologies (CQST)'
        | 'Centre for Design & Fabrication of Electronic Devices (C4DFED)'
        | 'Center for Human-Computer Interaction (CHCI)'
        | 'Center for Climate Change and Disaster Management (C3DAR)'
        | 'IIT Mandi i-Hub & HCI'
        | 'IKSMHA Center'
        | 'Centre for Continuing Education (CCE)'
        | 'JEE CELL'
        | 'JAM'
        | 'GATE'
        | 'Office of Chief Warden'
        | 'Parashar Hostel'
        | 'Chandertaal Hostel'
        | 'Suvalsar Hostel'
        | 'Nako Hostel'
        | 'Dashir Hostel'
        | 'Beas Kund Hostel'
        | 'Manimahesh Hostel'
        | 'Suraj Taal Hostel'
        | 'Gauri Kund Hostel'
        | 'Central Mess'
        | 'Sports'
        | 'NSS'
        | 'Guidance & Counselling Cell'
        | 'Construction & Maintainance Cell'
        | 'Transportation'
        | 'Guest House'
        | 'Housekeeping Services & Waste Management'
        | 'Creche'
        | 'Security Unit'
        | 'Common Rooms'
        | 'Career & Placement Cell'
        | 'IIT Mandi Catalyst'
        | 'Recreation Center'
        | 'CPWD'
        | 'Banks'
        | 'IPDC'
        | 'IR'
        | 'Mind Tree School'
        | 'Renuka Hostel'
        | 'Rewalsar'
        | 'Director Office'
        | 'Deans'
        | 'Associate Deans'
        | 'Registrar Office'
        | 'Administration and Establishment Section'
        | 'Faculty Establishment and Recruitment'
        | 'Finance and Accounts'
        | 'Store and Purchase Section'
        | 'Rajbhasa Section'
        | 'Ranking Cell (RC)'
        | 'Media Cell'
        | 'Academics Section'
        | 'Academic Affairs'
        | 'Research Affairs'
        | 'Legal Section'
        | 'Internal Audit'
        | 'Central Library'
        | 'DIGITAL AND COMPUTING SERVICES'
        | 'Dean (SRIC & IR ) Office'
        | 'Dean (Students) Office'
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
export type Department = Database['public']['Enums']['department']

// Extended types with relations
export type BillWithEmployee = Bill & {
  employees?: Employee | null
}

export type EmployeeWithPDABalance = Employee & {
  pda_balances?: PDABalance[]
}