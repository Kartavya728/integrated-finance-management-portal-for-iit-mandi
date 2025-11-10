"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "./Logo";
import SidebarLinks from "./SidebarLinks";
import UploadBill from "./UploadBill";
import BillsHistory from "./BillsHistory";
import ApprovedBills from "./ApprovedBills"; // ✅ import the ApprovedBills component
import { Bill } from "./types";

type PageView = "upload" | "history" | "approved"; // ✅ add new page type

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<PageView>("upload");
  const [department, setDepartment] = useState<string | null>(null);

  // Fetch department and bills
  useEffect(() => {
    const fetchDepartmentAndBills = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      setLoading(true);
      try {
        // Fetch department of the employee
        const { data: emp, error: empErr } = await supabase
          .from("employees")
          .select("department")
          .or(
            [
              `employee_code.eq.${userId}`,
              `employee_code.like.%${userId}%`,
              `employee_code.like.%${userId}`,
              `employee_code.like.${userId}%`
            ].join(",")
        )
        .maybeSingle();

        if (empErr) throw empErr;
        const dept = emp?.department || null;
        setDepartment(dept);

        if (!dept) {
          setBills([]);
          return;
        }

        // Fetch department bills (not approved)
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_department", dept)
          .not("employee_department", "is", null)
          .or("snp.eq.Reject,audit.eq.Reject,finance_admin.eq.Reject")
          .or("noted.is.null,noted.eq.false")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching department-scoped bills:", err);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentAndBills();
  }, [session, activePage]);

  const handleBillSubmitted = () => {
    setActivePage("history");
    refreshBills();
  };

  const handleBillUpdated = () => refreshBills();

  const handleBillNoted = (billId: string) => {
    setBills((prev) => prev.filter((bill) => bill.id !== billId));
  };

  const refreshBills = async () => {
    try {
      if (!department) return;
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("employee_department", department)
        .not("employee_department", "is", null)
        .or("snp.eq.Reject,audit.eq.Reject,finance_admin.eq.Reject")
        .or("noted.is.null,noted.eq.false")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error("Error refreshing bills:", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {/* === Sidebar Links === */}
              <button
                onClick={() => setActivePage("upload")}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  activePage === "upload" ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
                }`}
              >
                {open && "Apply Bill"}
              </button>

              <button
                onClick={() => setActivePage("history")}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  activePage === "history" ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
                }`}
              >
                {open && "Bill History"}
              </button>

              {/* ✅ New Approved Bills Sidebar Option */}
              <button
                onClick={() => setActivePage("approved")}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  activePage === "approved" ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
                }`}
              >
                {open && "Approved Bills"}
              </button>

              {/* Logout */}
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

      {/* Main Content */}
      <div className="flex flex-1 p-6 overflow-y-auto bg-gray-50">
        {activePage === "upload" && (
          <UploadBill onBillSubmitted={handleBillSubmitted} department={department} />
        )}

        {activePage === "history" && (
          <BillsHistory
            bills={bills}
            loading={loading}
            onBillUpdated={handleBillUpdated}
            allowDelete
            enableEdit={false}
            onBillNoted={handleBillNoted}
          />
        )}

        {/* ✅ Approved Bills page rendering */}
        {activePage === "approved" && <ApprovedBills department={department} />}
      </div>
    </div>
  );
}
