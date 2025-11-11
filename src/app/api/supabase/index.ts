import { supabase as sharedSupabase } from "@/lib/supabaseClient";

// Use shared Supabase client to ensure apikey header is set
const supabase = sharedSupabase;



export default supabase;

export async function getEmployeeDetailsByUserId(userId: string): Promise<{ employee_type: string; employee_code: string | null }> {
  console.log('[getEmployeeDetailsByUserId] fetching employee details', { userId });
  const { data, error } = await supabase
    .from('employees')
    .select('employee_type, employee_code')
    .or(
      [
        `employee_code.eq.${userId}`,
        `employee_code.like.%${userId}%`,
        `employee_code.like.%${userId}`,
        `employee_code.like.${userId}%`
      ].join(",")
    )
    .single();

  console.log('[getEmployeeDetailsByUserId] query result', { error, data });

  if (error || !data) {
    console.warn('[getEmployeeDetailsByUserId] employee not found, defaulting to "User"', { userId, error });
    return { employee_type: 'User', employee_code: null };
  }

  return {
    employee_type: data.employee_type || 'User',
    employee_code: data.employee_code,
  };
}
