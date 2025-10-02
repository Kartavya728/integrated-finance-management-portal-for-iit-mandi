"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase/client";
import BillsHistory from "../apply-bill/BillsHistory";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "../apply-bill/Logo";
import { signOut, useSession } from "next-auth/react";
import { Bill } from "../apply-bill/types";

export default function BillEditorPage() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartmentAndBills = async () => {
      const userId = session?.user?.id;
      if (!userId) return;
      setLoading(true);
      try {
        const { data: emp, error: empErr } = await supabase
          .from("employees")
          .select("department")
          .eq("id", userId)
          .single();
        if (empErr) throw empErr;
        const dept = (emp as { department: string | null } | null)?.department || null;
        setDepartment(dept);

        if (!dept) {
          setBills([]);
          return;
        }

        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_department", dept)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartmentAndBills();
  }, [session]);

  const handleBillUpdated = () => {
    // Refresh after any edit
    const fetchBills = async () => {
      try {
        if (!department) return;
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_department", department)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
      }
    };
    fetchBills();
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full mt-4"
              >
                <span className="h-5 w-5 shrink-0 text-neutral-700">←</span>
                {open && <span>Logout</span>}
              </button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1 p-6 overflow-y-auto bg-gray-50">
        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-6">Bill Editor</h2>
          <BillsHistory bills={bills} loading={loading} onBillUpdated={handleBillUpdated} alwaysEditable allowDelete={false} />
        </div>
      </div>
    </div>
  );
}


