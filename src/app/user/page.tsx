"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
import {
  IconReceipt2,
  IconWallet,
  IconEye,
  IconX,
  IconArrowLeft,
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
  item_description?: string;
  qty?: number;
  remarks?: string;
  remarks1?: string;
  remarks2?: string;
  remarks3?: string;
  remarks4?: string;
  snp?: string;
  audit?: string;
  finance_admin?: string;
}

interface Employee {
  id: string;
  employee_code: string;
  name: string;
  email?: string;
  username: string;
}
type PdaBalanceRow = { balance: number };

export default function UserPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const username = session?.user?.username;
        if (!username) return;

        const { data: employeeData } = await supabase
          .from("employees")
          .select("*")
          .eq("username", username)
          .single();
        if (employeeData) setEmployee(employeeData);
        

const { data: balanceData, error } = await supabase
  .from("pda_balances")
  .select("balance")
  .eq("employee_id", username)
  .maybeSingle<PdaBalanceRow>();
  
if (error) {
  console.error("Error fetching balance:", error.message);
  setBalance(0);
} else {
  setBalance(balanceData?.balance ?? 0);
}

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
    { label: "Dashboard", href: "/user", icon: <IconWallet className="h-5 w-5 shrink-0 text-neutral-700" /> },
  ];

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Logout pinned at bottom */}
          <div className="flex flex-col gap-3">
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
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full"
            >
              <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
              <span>Logout</span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto p-6">
        {loading ? (
          <p className="text-gray-500">Loading dashboard...</p>
        ) : (
          <>
            {/* Welcome + Balance */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {employee?.name || session?.user?.username}
              </h1>
              <p className="text-gray-600 text-sm">Integrated Finance Management Portal - IIT Mandi</p>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
              >
                {showBalance ? "Hide PDA Balance" : "Show PDA Balance"}
              </button>
              {showBalance && (
                <p className="text-lg font-semibold text-green-600">
                  PDA Balance: ₹{balance.toLocaleString()}
                </p>
              )}
            </div>

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
                <div className="mt-3 grid grid-cols-1 gap-4">
                  {bills.map((bill) => {
                    let statusLabel = "Unknown";
                    let borderClasses = "border-gray-700";
                    let titleClasses = "text-black";

                    if (bill.status === "Accepted") {
                      statusLabel = "Approved (All Stages)";
                      borderClasses = "border-4 border-green-600";
                      titleClasses = "text-green-600 font-bold";
                    } else if (
                      bill.audit === "Reject" ||
                      bill.finance_admin === "Reject" ||
                      bill.snp === "Reject"
                    ) {
                      statusLabel = "Rejected";
                      borderClasses = "border-4 border-red-600";
                      titleClasses = "text-red-600 font-bold";
                    } else if (
                      bill.audit === "Hold" ||
                      bill.finance_admin === "Hold" ||
                      bill.snp === "Hold"
                    ) {
                      statusLabel = "On Hold";
                      borderClasses = "border-4 border-yellow-500";
                      titleClasses = "text-yellow-600 font-bold";
                    } else {
                      if (bill.status === "Audit") statusLabel = "Pending at Audit";
                      else if (bill.status === "Finance Admin")
                        statusLabel = "Pending at Finance Admin";
                      else if (bill.status === "Student Purchase")
                        statusLabel = "Pending at Student Purchase";

                      borderClasses = "border border-gray-700";
                      titleClasses = "text-black font-bold";
                    }

                    const remarksDisplay: string[] = [];
                    if (bill.remarks) remarksDisplay.push(`Remark by User: ${bill.remarks}`);
                    if (bill.remarks1) remarksDisplay.push(`Remark by SnP: ${bill.remarks1}`);
                    if (bill.remarks2) remarksDisplay.push(`Remark by Audit: ${bill.remarks2}`);
                    if (bill.remarks3) remarksDisplay.push(`Remark by Finance Admin: ${bill.remarks3}`);
                    if (bill.remarks4) remarksDisplay.push(`Remark by Other: ${bill.remarks4}`);

                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-xl p-4 ${borderClasses}`}
                      >
                        <h3 className={`text-md ${titleClasses}`}>
                          {bill.item_description || "No description"}
                        </h3>
                        <p className="mt-1 text-gray-600">
                          Qty: {bill.qty || 0} | Amount: ₹{bill.po_value || 0}
                        </p>
                        <hr className="my-2 border-gray-200" />
                        <p className="text-sm font-semibold text-gray-800">
                          Status: {statusLabel}
                        </p>

                        <div className="mt-2">
                          {remarksDisplay.length > 0 ? (
                            remarksDisplay.map((r, idx) => (
                              <p key={idx} className="text-md font-bold text-gray-700 mt-1">
                                {r}
                              </p>
                            ))
                          ) : (
                            <p className="text-md font-bold text-gray-500">
                              Remark: No remark added yet
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end mt-3">
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                          >
                            <IconEye size={16} /> View Details
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Expand Details Modal */}
      <AnimatePresence>
        {selectedBill && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-3xl overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bill Details</h2>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-600 hover:text-black"
                >
                  <IconX size={20} />
                </button>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(selectedBill, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Sidebar Logos */
export const Logo = () => (
  <a href="#" className="flex items-center space-x-2 py-1 text-sm font-semibold text-black">
    <img src="/iit.png" alt="IIT Mandi" className="h-7 w-7" />
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre text-black">
      IIT Mandi Finance
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a href="#" className="flex items-center space-x-2 py-1 text-sm font-semibold text-black">
    <img src="/iit.png" alt="IIT Mandi" className="h-7 w-7" />
  </a>
);
