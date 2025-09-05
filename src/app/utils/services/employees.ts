import { supabase } from '@/utils/supabase/client'
import { Employee, EmployeeInsert, EmployeeUpdate, EmployeeWithPDABalance } from '@/types/database'

export const employeesService = {
  // Get all employees
  async getEmployees(): Promise<{ data: EmployeeWithPDABalance[] | null; error: any }> {
    return await supabase
      .from('employees')
      .select(`
        *,
        pda_balances!pda_balances_employee_id_fkey (
          id,
          balance,
          updated_at
        )
      `)
      .order('created_at', { ascending: false })
  },

  // Get employee by ID
  async getEmployeeById(id: string): Promise<{ data: EmployeeWithPDABalance | null; error: any }> {
    return await supabase
      .from('employees')
      .select(`
        *,
        pda_balances!pda_balances_employee_id_fkey (
          id,
          balance,
          updated_at
        )
      `)
      .eq('id', id)
      .single()
  },

  // Get employee by email
  async getEmployeeByEmail(email: string): Promise<{ data: Employee | null; error: any }> {
    return await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .single()
  },

  // Get employee by employee code
  async getEmployeeByCode(employeeCode: string): Promise<{ data: Employee | null; error: any }> {
    return await supabase
      .from('employees')
      .select('*')
      .eq('employee_code', employeeCode)
      .single()
  },

  // Create a new employee
  async createEmployee(employee: EmployeeInsert): Promise<{ data: Employee | null; error: any }> {
    return await supabase
      .from('employees')
      .insert({
        ...employee,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
  },

  // Update an employee
  async updateEmployee(id: string, updates: EmployeeUpdate): Promise<{ data: Employee | null; error: any }> {
    return await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  },

  // Delete an employee
  async deleteEmployee(id: string): Promise<{ error: any }> {
    return await supabase
      .from('employees')
      .delete()
      .eq('id', id)
  },

  // Get employees by type
  async getEmployeesByType(employeeType: string): Promise<{ data: Employee[] | null; error: any }> {
    return await supabase
      .from('employees')
      .select('*')
      .eq('employee_type', employeeType)
      .order('created_at', { ascending: false })
  },

  // Search employees
  async searchEmployees(query: string): Promise<{ data: Employee[] | null; error: any }> {
    return await supabase
      .from('employees')
      .select('*')
      .or(`email.ilike.%${query}%,employee_code.ilike.%${query}%`)
      .order('created_at', { ascending: false })
  },

  // Check if employee code exists
  async checkEmployeeCodeExists(employeeCode: string, excludeId?: string): Promise<{ exists: boolean; error: any }> {
    let query = supabase
      .from('employees')
      .select('id')
      .eq('employee_code', employeeCode)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) return { exists: false, error }

    return { exists: (data?.length || 0) > 0, error: null }
  },

  // Check if email exists
  async checkEmailExists(email: string, excludeId?: string): Promise<{ exists: boolean; error: any }> {
    let query = supabase
      .from('employees')
      .select('id')
      .eq('email', email)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) return { exists: false, error }

    return { exists: (data?.length || 0) > 0, error: null }
  },

  // Get employee statistics
  async getEmployeeStats(): Promise<{
    data: {
      totalEmployees: number
      financeAdminCount: number
      financeEmployeeCount: number
      auditCount: number
      studentPurchaseCount: number
    } | null
    error: any
  }> {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('employee_type')

      if (error) return { data: null, error }

      const stats = employees?.reduce(
        (acc, employee) => {
          acc.totalEmployees++

          switch (employee.employee_type) {
            case 'Finance Admin':
              acc.financeAdminCount++
              break
            case 'Finance Employee':
              acc.financeEmployeeCount++
              break
            case 'Audit':
              acc.auditCount++
              break
            case 'Student Purchase':
              acc.studentPurchaseCount++
              break
          }

          return acc
        },
        {
          totalEmployees: 0,
          financeAdminCount: 0,
          financeEmployeeCount: 0,
          auditCount: 0,
          studentPurchaseCount: 0,
        }
      ) || {
        totalEmployees: 0,
        financeAdminCount: 0,
        financeEmployeeCount: 0,
        auditCount: 0,
        studentPurchaseCount: 0,
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}