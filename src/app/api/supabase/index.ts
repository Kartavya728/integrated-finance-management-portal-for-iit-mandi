"use client"
import { supabase } from "@/lib/supabaseClient";



export default supabase;

export async function getEmployeeTypeByUserId(userId: string): Promise<string | null> {
  console.log(userId)
  console.log(userId)
  console.log(userId)

  console.log(userId)
  console.log(userId)
















  console.log(userId)
 
  const { data, error } = await supabase
    .from('employees') 
    .select('employee_type')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }
  console.log(data.employee_type)
  console.log(1)
  return data.employee_type;
}
