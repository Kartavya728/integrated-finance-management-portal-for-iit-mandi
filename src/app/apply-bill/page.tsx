"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase/client";
import { signOut } from "next-auth/react";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "./Logo";
import SidebarLinks from "./SidebarLinks";
import UploadBill from "./UploadBill";
import BillsHistory from "./BillsHistory";
import { Bill } from "./types";

type PageView = "upload" | "history";

export default function EmployeeDashboard() {
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<PageView>("upload");

  // Fetch all bills
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [activePage]);

  const handleBillSubmitted = () => {
    setActivePage("history");
    // Refresh bills after submission
    const fetchBills = async () => {
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
      }
    };
    fetchBills();
  };

  const handleBillUpdated = () => {
    // Refresh bills after update
    const fetchBills = async () => {
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
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
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              <SidebarLinks 
                activePage={activePage} 
                setActivePage={setActivePage}
                open={open}
              />
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
          <UploadBill onBillSubmitted={handleBillSubmitted} />
        )}

        {activePage === "history" && (
          <BillsHistory 
            bills={bills} 
            loading={loading}
            onBillUpdated={handleBillUpdated}
          />
        )}
      </div>
    </div>
  );
}