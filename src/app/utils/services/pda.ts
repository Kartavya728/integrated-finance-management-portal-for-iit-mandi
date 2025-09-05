import { supabase } from '../../utils/supabase/client'
import { PDABalance, PDABalanceInsert, PDABalanceUpdate } from '@/types/database'

export const pdaService = {
  // Get PDA balance for an employee
  async getPDABalance(employeeId: string): Promise<{ data: PDABalance | null; error: any }> {
    return await supabase
      .from('pda_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .single()
  },

  // Get all PDA balances with employee details
  async getAllPDABalances(): Promise<{ data: (PDABalance & { employees?: any })[] | null; error: any }> {
    return await supabase
      .from('pda_balances')
      .select(`
        *,
        employees!pda_balances_employee_id_fkey (
          id,
          email,
          employee_type,
          employee_code
        )
      `)
      .order('updated_at', { ascending: false })
  },

  // Create initial PDA balance for an employee
  async createPDABalance(balance: PDABalanceInsert): Promise<{ data: PDABalance | null; error: any }> {
    return await supabase
      .from('pda_balances')
      .insert({
        ...balance,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
  },

  // Update PDA balance
  async updatePDABalance(employeeId: string, updates: PDABalanceUpdate): Promise<{ data: PDABalance | null; error: any }> {
    return await supabase
      .from('pda_balances')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', employeeId)
      .select()
      .single()
  },

  // Update PDA balance by ID
  async updatePDABalanceById(id: string, updates: PDABalanceUpdate): Promise<{ data: PDABalance | null; error: any }> {
    return await supabase
      .from('pda_balances')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
  },

  // Get or create PDA balance (ensures employee has a balance record)
  async getOrCreatePDABalance(employeeId: string, initialBalance: number = 0): Promise<{ data: PDABalance | null; error: any }> {
    // First try to get existing balance
    const { data: existingBalance, error: fetchError } = await this.getPDABalance(employeeId)
    
    if (existingBalance) {
      return { data: existingBalance, error: null }
    }

    // If no balance exists, create one
    if (fetchError && fetchError.code === 'PGRST116') { // No rows returned
      return await this.createPDABalance({
        employee_id: employeeId,
        balance: initialBalance,
      })
    }

    return { data: null, error: fetchError }
  },

  // Add balance to employee's PDA
  async addBalance(employeeId: string, amount: number): Promise<{ data: PDABalance | null; error: any }> {
    const { data: currentBalance, error } = await this.getPDABalance(employeeId)
    
    if (error || !currentBalance) {
      // If no balance exists, create one with the amount
      if (error && error.code === 'PGRST116') {
        return await this.createPDABalance({
          employee_id: employeeId,
          balance: amount,
        })
      }
      return { data: null, error: error || new Error('Balance not found') }
    }

    const newBalance = (currentBalance.balance || 0) + amount

    return await this.updatePDABalance(employeeId, {
      balance: newBalance,
    })
  },

  // Deduct balance from employee's PDA
  async deductBalance(employeeId: string, amount: number): Promise<{ data: PDABalance | null; error: any }> {
    const { data: currentBalance, error } = await this.getPDABalance(employeeId)
    
    if (error || !currentBalance) {
      return { data: null, error: error || new Error('Balance not found') }
    }

    const currentAmount = currentBalance.balance || 0
    if (currentAmount < amount) {
      return { data: null, error: new Error('Insufficient balance') }
    }

    const newBalance = currentAmount - amount

    return await this.updatePDABalance(employeeId, {
      balance: newBalance,
    })
  },

  // Set balance for employee's PDA
  async setBalance(employeeId: string, amount: number): Promise<{ data: PDABalance | null; error: any }> {
    const { data: existingBalance, error } = await this.getPDABalance(employeeId)
    
    if (existingBalance) {
      return await this.updatePDABalance(employeeId, {
        balance: amount,
      })
    }

    // Create new balance if doesn't exist
    if (error && error.code === 'PGRST116') {
      return await this.createPDABalance({
        employee_id: employeeId,
        balance: amount,
      })
    }

    return { data: null, error }
  },

  // Delete PDA balance
  async deletePDABalance(id: string): Promise<{ error: any }> {
    return await supabase
      .from('pda_balances')
      .delete()
      .eq('id', id)
  },

  // Get total PDA statistics
  async getPDAStats(): Promise<{
    data: {
      totalEmployees: number
      totalBalance: number
      averageBalance: number
      employeesWithBalance: number
    } | null
    error: any
  }> {
    try {
      const { data: balances, error } = await supabase
        .from('pda_balances')
        .select('balance')

      if (error) return { data: null, error }

      const stats = balances?.reduce(
        (acc, balance) => {
          acc.totalEmployees++
          const amount = balance.balance || 0
          acc.totalBalance += amount
          if (amount > 0) {
            acc.employeesWithBalance++
          }
          return acc
        },
        {
          totalEmployees: 0,
          totalBalance: 0,
          averageBalance: 0,
          employeesWithBalance: 0,
        }
      ) || {
        totalEmployees: 0,
        totalBalance: 0,
        averageBalance: 0,
        employeesWithBalance: 0,
      }

      if (stats.totalEmployees > 0) {
        stats.averageBalance = stats.totalBalance / stats.totalEmployees
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}