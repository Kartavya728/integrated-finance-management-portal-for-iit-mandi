"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
import {
  IconArrowLeft,
  IconReceipt2,
  IconWallet,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface Bill {
  id: string;
  po_details: string;
  supplier_name: string;
  po_value: number;
  status: string;
  created_at?: string;
  employee_id: string;
}

interface Employee {
  id: string;
  employee_code: string;
  name: string;
  email?: string;
  username: string;
}

export default function UserPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const username = session?.user?.username;
        if (!username) return;

        // Get employee record
        const { data: employeeData } = await supabase
          .from("employees")
          .select("*")
          .eq("username", username)
          .single();

        if (employeeData) setEmployee(employeeData);

        // Fetch PDA balance
        const { data: balanceData } = await supabase
          .from("pda_balances")
          .select("balance")
          .eq("employee_id", username)
          .single();
        setBalance(balanceData?.balance || 0);

        // Fetch bills
        const { data: billsData } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_id", username)
          .order("created_at", { ascending: false });
        setBills(billsData || []);
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const links = [
    {
      label: "Dashboard",
      href: "/user",
      icon: <IconWallet className="h-5 w-5 shrink-0 text-neutral-700" />,
    },
    {
      label: "Apply for Bill",
      href: "/apply-bill",
      icon: <IconReceipt2 className="h-5 w-5 shrink-0 text-neutral-700" />,
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-gray-300 bg-white md:flex-row",
        "h-screen"
      )}
    >
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              {/* Logout button */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full mt-2"
              >
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: employee?.name || session?.user?.username || "User",
                href: "#",
                icon: (
                  <img
                    src="/iit.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="IIT Mandi Logo"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Dashboard */}
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-gray-300 bg-white p-6 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500">Loading dashboard...</p>
          ) : (
            <>
              {/* PDA Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  PDA Balance
                </h2>
                <p className="mt-2 text-2xl font-bold text-green-600">
                  ₹ {balance.toLocaleString()}
                </p>
              </motion.div>

              {/* Bills Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Bill Applications
                </h2>
                {bills.length === 0 ? (
                  <p className="mt-3 text-gray-500">No bills submitted yet.</p>
                ) : (
                  <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                    {bills.slice(0, 5).map((bill) => (
                      <li key={bill.id}>
                        {bill.po_details} –{" "}
                        <span className="font-medium">{bill.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Sidebar Logos ------------------------- */
export const Logo = () => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-7 w-7" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="whitespace-pre text-black"
    >
      IIT Mandi Finance
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-7 w-7" />
  </a>
);
