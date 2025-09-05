import { supabase } from '../../utils/supabase/client'
import { Bill, BillInsert, BillUpdate, BillWithEmployee } from '@/types/database'

export const billsService = {
  // Get all bills for an employee
  async getBills(employeeId?: string): Promise<{ data: BillWithEmployee[] | null; error: any }> {
    let query = supabase
      .from('bills')
      .select(`
        *,
        employees!bills_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .order('created_at', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    return await query
  },

  // Get a single bill by ID
  async getBillById(id: string): Promise<{ data: BillWithEmployee | null; error: any }> {
    return await supabase
      .from('bills')
      .select(`
        *,
        employees!bills_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .eq('id', id)
      .single()
  },

  // Create a new bill
  async createBill(bill: BillInsert): Promise<{ data: Bill | null; error: any }> {
    return await supabase
      .from('bills')
      .insert({
        ...bill,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
  },

  // Update a bill
  async updateBill(id: string, updates: BillUpdate): Promise<{ data: Bill | null; error: any }> {
    return await supabase
      .from('bills')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  },

  // Delete a bill
  async deleteBill(id: string): Promise<{ error: any }> {
    return await supabase
      .from('bills')
      .delete()
      .eq('id', id)
  },

  // Get bills by status
  async getBillsByStatus(status: string, employeeId?: string): Promise<{ data: BillWithEmployee[] | null; error: any }> {
    let query = supabase
      .from('bills')
      .select(`
        *,
        employees!bills_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    return await query
  },

  // Get recent bills
  async getRecentBills(limit: number = 10, employeeId?: string): Promise<{ data: BillWithEmployee[] | null; error: any }> {
    let query = supabase
      .from('bills')
      .select(`
        *,
        employees!bills_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    return await query
  },

  // Update bill status
  async updateBillStatus(
    billId: string,
    newStatus: string,
    remarks?: string
  ): Promise<{ data: Bill | null; error: any }> {
    const updates: BillUpdate = {
      status: newStatus,
    }

    // Add remarks to appropriate field based on status
    if (remarks) {
      switch (newStatus) {
        case 'Student Purchase':
          updates.remarks1 = remarks
          break
        case 'Audit':
          updates.remarks2 = remarks
          break
        case 'Finance Admin':
          updates.remarks3 = remarks
          break
        case 'Accepted':
          updates.remarks4 = remarks
          break
        default:
          updates.remarks = remarks
          break
      }
    }

    return await this.updateBill(billId, updates)
  },

  // Search bills
  async searchBills(query: string, employeeId?: string): Promise<{ data: BillWithEmployee[] | null; error: any }> {
    let searchQuery = supabase
      .from('bills')
      .select(`
        *,
        employees!bills_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .or(`po_details.ilike.%${query}%,supplier_name.ilike.%${query}%,item_description.ilike.%${query}%,bill_details.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (employeeId) {
      searchQuery = searchQuery.eq('employee_id', employeeId)
    }

    return await searchQuery
  },

  // Get dashboard statistics
  async getDashboardStats(employeeId?: string): Promise<{
    data: {
      totalBills: number
      userBills: number
      studentPurchaseBills: number
      auditBills: number
      financeAdminBills: number
      acceptedBills: number
      totalValue: number
      pendingValue: number
    } | null
    error: any
  }> {
    try {
      let query = supabase.from('bills').select('status, po_value')
      
      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      const { data: bills, error } = await query

      if (error) return { data: null, error }

      const stats = bills?.reduce(
        (acc, bill) => {
          acc.totalBills++
          const value = bill.po_value || 0
          acc.totalValue += value

          switch (bill.status) {
            case 'User':
              acc.userBills++
              acc.pendingValue += value
              break
            case 'Student Purchase':
              acc.studentPurchaseBills++
              acc.pendingValue += value
              break
            case 'Audit':
              acc.auditBills++
              acc.pendingValue += value
              break
            case 'Finance Admin':
              acc.financeAdminBills++
              acc.pendingValue += value
              break
            case 'Accepted':
              acc.acceptedBills++
              break
          }

          return acc
        },
        {
          totalBills: 0,
          userBills: 0,
          studentPurchaseBills: 0,
          auditBills: 0,
          financeAdminBills: 0,
          acceptedBills: 0,
          totalValue: 0,
          pendingValue: 0,
        }
      ) || {
        totalBills: 0,
        userBills: 0,
        studentPurchaseBills: 0,
        auditBills: 0,
        financeAdminBills: 0,
        acceptedBills: 0,
        totalValue: 0,
        pendingValue: 0,
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get bills for workflow (by employee type)
  async getBillsForWorkflow(employeeType: string, limit?: number): Promise<{ data: BillWithEmployee[] | null; error: any }> {
    let targetStatus: string

    switch (employeeType) {
      case 'Student Purchase':
        targetStatus = 'User'
        break
      case 'Audit':
        targetStatus = 'Student Purchase'
        break
      case 'Finance Admin':
        targetStatus = 'Audit'
        break
      default:
        return { data: [], error: null }
    }

    let query = supabase
      .from('bills')
      .select(`
        *,
        employees!bills_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .eq('status', targetStatus)
      .order('created_at', { ascending: true }) // Oldest first for workflow

    if (limit) {
      query = query.limit(limit)
    }

    return await query
  },
}