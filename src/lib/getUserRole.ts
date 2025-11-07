import { supabase } from "./supabaseClient";

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_type")
    .eq("employee_code", userId)
    .single();

  if (error) throw error;
  return data?.employee_type;
}
