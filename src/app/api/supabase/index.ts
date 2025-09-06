import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);



export default supabase;

export async function getEmployeeTypeByUserId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('employees') 
    .select('employee_type')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.employee_type;
}
