import { supabase as sharedSupabase } from "@/lib/supabaseClient";

// Use shared Supabase client to ensure apikey header is set
const supabase = sharedSupabase;



export default supabase;

export async function getEmployeeTypeByUserId(userId: string): Promise<string> {
  console.log('[getEmployeeTypeByUserId] fetching employee type', { userId });
  const { data, error } = await supabase
    .from('employees') 
    .select('employee_type')
    .eq('id', userId)
    .single();

  console.log('[getEmployeeTypeByUserId] query result', { error, data });

  if (error || !data || !data.employee_type) {
    console.warn('[getEmployeeTypeByUserId] employee not found or missing type, defaulting to "User"', { userId, error });
    return 'User';
  }

  return data.employee_type;
}
