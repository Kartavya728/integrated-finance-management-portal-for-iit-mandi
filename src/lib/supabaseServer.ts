import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase"; // optional: your generated types

export const createClient = () => {
  return createServerComponentClient<Database>({ cookies });
};
