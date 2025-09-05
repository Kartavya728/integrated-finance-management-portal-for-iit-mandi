// src/app/api/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ Exported function
export async function getEmployeeByCode(employee_code: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("employee_code", employee_code)
    .single();

  if (error) {
    console.error("Error fetching employee:", error.message);
    return null;
  }

  return data;
}
