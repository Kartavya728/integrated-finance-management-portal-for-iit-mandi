"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconClockPause,
  IconHome,
  IconListDetails,
  IconCode,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/* ---------- Interfaces ---------- */
interface Bill {
  id: string;
  po_details: string;
  supplier_name: string;
  po_value: number;
  status: string;
  snp: string;
  audit: string;
  finance_admin: string;
  created_at?: string;
  employee_id: string;
  item_description?: string;
  qty?: number;
  remarks1?: string; // audit remark
  remarks2?: string; // snp remark
}

export default function AuditDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Approved" | "Hold" | "Reject" | "Pending"
  >("All");
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [jsonView, setJsonView] = useState<string | null>(null);

  // fetch bills
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        // exclude student purchase
        const filtered = (data || []).filter(
          (b: Bill) => b.status !== "Student Purchase"
        );
        setBills(filtered);
      } catch (err) {
        console.error("Error fetching bills:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // Approve
  const handleApprove = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from("bills")
        .update({
          status: "Finance Admin",
          audit: "Approved",
          finance_admin: "Pending",
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, status: "Finance Admin", audit: "Approved", finance_admin: "Pending" }
            : b
        )
      );
    } catch (err) {
      console.error("Error approving bill:", err);
    }
  };

  // Hold
  const handleHold = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before holding.");
      return;
    }
    try {
      const { error } = await supabase
        .from("bills")
        .update({ audit: "Hold", remarks1: remarks[bill.id] })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id ? { ...b, audit: "Hold", remarks1: remarks[bill.id] } : b
        )
      );
    } catch (err) {
      console.error("Error putting bill on hold:", err);
    }
  };

  // Reject
  const handleReject = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before rejecting.");
      return;
    }
    try {
      const { error } = await supabase
        .from("bills")
        .update({ audit: "Reject", remarks1: remarks[bill.id] })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id ? { ...b, audit: "Reject", remarks1: remarks[bill.id] } : b
        )
      );
    } catch (err) {
      console.error("Error rejecting bill:", err);
    }
  };

  // filtered bills
  const filteredBills =
    activeFilter === "All"
      ? bills
      : activeFilter === "Pending"
      ? bills.filter((b) => b.audit === "Pending")
      : bills.filter((b) => b.audit === activeFilter);

  const links = [
    {
      label: "All Bills",
      icon: <IconListDetails className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActiveFilter("All"),
    },
    {
      label: "Pending Bills",
      icon: <IconClockPause className="h-5 w-5 shrink-0 text-gray-600" />,
      onClick: () => setActiveFilter("Pending"),
    },
    {
      label: "Approved Bills",
      icon: <IconCheck className="h-5 w-5 shrink-0 text-green-600" />,
      onClick: () => setActiveFilter("Approved"),
    },
    {
      label: "Hold Bills",
      icon: <IconClockPause className="h-5 w-5 shrink-0 text-yellow-600" />,
      onClick: () => setActiveFilter("Hold"),
    },
    {
      label: "Rejected Bills",
      icon: <IconX className="h-5 w-5 shrink-0 text-red-600" />,
      onClick: () => setActiveFilter("Reject"),
    },
    {
      label: "Back to User Page",
      href: "/user",
      icon: <IconHome className="h-5 w-5 shrink-0 text-blue-600" />,
    },
  ];

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white md:flex-row">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) =>
                link.href ? (
                  <SidebarLink key={idx} link={link} />
                ) : (
                  <button
                    key={idx}
                    onClick={link.onClick}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded text-left w-full",
                      activeFilter === link.label.replace(" Bills", "") && "bg-gray-200 font-medium"
                    )}
                  >
                    {link.icon}
                    {open && <span>{link.label}</span>}
                  </button>
                )
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full mt-4"
              >
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
                {open && <span>Logout</span>}
              </button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 bg-gray-50 overflow-y-auto">
        <div className="flex w-full flex-col gap-6 p-4">
          {loading ? (
            <p className="text-gray-500">Loading Audit bills...</p>
          ) : (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-semibold text-gray-800"
              >
                Audit Department – {activeFilter} Bills
              </motion.h1>

              {filteredBills.length === 0 ? (
                <p className="text-gray-500">No bills found.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredBills.map((bill) => {
                    const isExpanded = expandedBill === bill.id;
                    const locked = bill.audit === "Approved" || bill.audit === "Reject";

                    return (
                      <div
                        key={bill.id}
                        className={cn(
                          "rounded-lg p-4 shadow cursor-pointer",
                          bill.audit === "Approved"
                            ? "border-4 border-green-500"
                            : bill.audit === "Reject"
                            ? "border-4 border-red-500"
                            : bill.audit === "Hold"
                            ? "border-4 border-yellow-500"
                            : "border border-gray-300"
                        )}
                        onClick={() =>
                          setExpandedBill(isExpanded ? null : bill.id)
                        }
                      >
                        <h2
                          className={cn(
                            "text-lg font-semibold",
                            bill.audit === "Approved"
                              ? "text-green-600"
                              : bill.audit === "Reject"
                              ? "text-red-600"
                              : bill.audit === "Hold"
                              ? "text-yellow-600"
                              : "text-gray-700"
                          )}
                        >
                          {bill.po_details} – {bill.supplier_name}
                        </h2>
                        <p className="text-gray-600">Value: ₹ {bill.po_value}</p>
                        <p className="text-sm font-medium">
                          Status: {bill.audit} at Audit
                        </p>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3 space-y-2"
                            >
                              <p className="text-gray-700">
                                Item: {bill.item_description}
                              </p>
                              <p className="text-gray-700">Qty: {bill.qty}</p>

                              {/* Remarks */}
                              {bill.remarks1 && (
                                <p className="font-bold text-gray-700">
                                  Audit Remark: {bill.remarks1}
                                </p>
                              )}
                              {bill.remarks2 && (
                                <p className="font-bold text-gray-700">
                                  SnP Remark: {bill.remarks2}
                                </p>
                              )}

                              {/* Remark Input */}
                              {!locked && (
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="text"
                                    placeholder="Enter remark..."
                                    value={remarks[bill.id] || ""}
                                    onChange={(e) =>
                                      setRemarks((prev) => ({
                                        ...prev,
                                        [bill.id]: e.target.value,
                                      }))
                                    }
                                    className="flex-1 px-2 py-1 border rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setJsonView(JSON.stringify(bill, null, 2));
                                    }}
                                    className="p-2 rounded bg-gray-200 hover:bg-gray-300"
                                  >
                                    <IconCode className="h-5 w-5 text-gray-700" />
                                  </button>
                                </div>
                              )}

                              {/* Action buttons */}
                              {!locked && (
                                <div className="flex gap-3 mt-3">
                                  {bill.audit === "Pending" && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApprove(bill);
                                        }}
                                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleHold(bill);
                                        }}
                                        className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                                      >
                                        Hold
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReject(bill);
                                        }}
                                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {bill.audit === "Hold" && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleApprove(bill);
                                        }}
                                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReject(bill);
                                        }}
                                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* JSON Modal */}
      <AnimatePresence>
        {jsonView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setJsonView(null)}
          >
            <div
              className="bg-white p-6 rounded-lg max-w-2xl w-full h-96 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <pre className="text-sm text-gray-800">{jsonView}</pre>
              <button
                onClick={() => setJsonView(null)}
                className="mt-3 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------- Sidebar Logos ------------------------- */
export const Logo = () => (
  <a
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-base font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
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
    className="relative z-20 flex items-center py-1 text-sm font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
  </a>
);
