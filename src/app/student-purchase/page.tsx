"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  IconClock,
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
  created_at?: string;
  employee_id: string;
  item_description?: string;
  qty?: number;
  remarks?: string;
}

export default function SnpDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Approved" | "Hold" | "Reject" | "Pending"
  >("All");
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [jsonViewId, setJsonViewId] = useState<string | null>(null);

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
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // approve handler
  const handleApprove = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from("bills")
        .update({
          status: "Audit",
          audit: "Pending",
          snp: "Approved",
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, status: "Audit", audit: "Pending", snp: "Approved" }
            : b
        )
      );
    } catch (err) {
      console.error("Error approving bill:", err);
    }
  };

  // reject handler
  const handleReject = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from("bills")
        .update({
          snp: "Reject",
          remarks: remarks[bill.id] || null,
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id ? { ...b, snp: "Reject" } : b
        )
      );
    } catch (err) {
      console.error("Error rejecting bill:", err);
    }
  };

  // hold handler
  const handleHold = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please enter a remark before putting the bill on Hold.");
      return;
    }

    try {
      const { error } = await supabase
        .from("bills")
        .update({
          snp: "Hold",
          remarks: remarks[bill.id],
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id ? { ...b, snp: "Hold", remarks: remarks[bill.id] } : b
        )
      );
    } catch (err) {
      console.error("Error holding bill:", err);
    }
  };

  // filtered bills
  const filteredBills =
    activeFilter === "All"
      ? bills
      : bills.filter((b) => b.snp === activeFilter);

  const pendingCount = bills.filter((b) => b.snp === "Pending").length;

  const links = [
    {
      label: "All Bills",
      icon: <IconListDetails className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActiveFilter("All"),
    },
    {
      label: "Pending Bills",
      icon: <IconClock className="h-5 w-5 shrink-0 text-gray-600" />,
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
  ];

  return (
    <div className="flex w-full h-screen bg-white shadow-lg">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="flex flex-col justify-between h-full">
          <div className="flex flex-col">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <button
                  key={idx}
                  onClick={link.onClick}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded text-left w-full",
                    activeFilter === link.label.replace(" Bills", "") &&
                      "bg-gray-200 font-medium"
                  )}
                >
                  {link.icon}
                  {open && <span>{link.label}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom links */}
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: "Back to User Page",
                href: "/user",
                icon: <IconHome className="h-5 w-5 shrink-0 text-blue-600" />,
              }}
            />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full"
            >
              <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
              {open && <span>Logout</span>}
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-8 overflow-y-auto">
        {loading ? (
          <p className="text-gray-500">Loading SNP bills...</p>
        ) : (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl font-bold text-gray-800 text-center"
            >
              IIT Mandi Finance Portal
            </motion.h1>
            <p className="text-center text-gray-600 font-medium">
              Total Pending Bills (SNP): {pendingCount}
            </p>

            {/* Bills Table */}
            {filteredBills.length === 0 ? (
              <p className="text-gray-500">No bills found.</p>
            ) : (
              <div className="space-y-4">
                {filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="rounded-lg border bg-white shadow-sm p-4"
                  >
                    {/* Summary Row */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {bill.po_details}
                        </p>
                        <p className="text-sm text-gray-600">
                          {bill.supplier_name} | ₹{" "}
                          {bill.po_value.toLocaleString()}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            bill.snp === "Approved"
                              ? "text-green-600"
                              : bill.snp === "Reject"
                              ? "text-red-600"
                              : bill.snp === "Hold"
                              ? "text-yellow-600"
                              : "text-gray-500"
                          )}
                        >
                          SNP: {bill.snp}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setExpandedBillId(
                            expandedBillId === bill.id ? null : bill.id
                          )
                        }
                        className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        {expandedBillId === bill.id ? "Hide" : "View"}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedBillId === bill.id && (
                      <div className="mt-4 space-y-2 border-t pt-3">
                        <p>
                          <b>Description:</b> {bill.item_description}
                        </p>
                        <p>
                          <b>Quantity:</b> {bill.qty}
                        </p>
                        <p>
                          <b>Status:</b> {bill.status}
                        </p>
                        <p>
                          <b>Audit:</b> {bill.audit}
                        </p>
                        {bill.remarks && (
                          <p className="font-semibold text-gray-700">
                            Remark: {bill.remarks}
                          </p>
                        )}

                        {/* Remark Input for Hold/Reject */}
                        {bill.snp !== "Approved" &&
                          bill.snp !== "Reject" && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter remark"
                                value={remarks[bill.id] || ""}
                                onChange={(e) =>
                                  setRemarks((prev) => ({
                                    ...prev,
                                    [bill.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 border rounded p-2 text-sm"
                              />
                              <button
                                onClick={() =>
                                  setJsonViewId(
                                    jsonViewId === bill.id ? null : bill.id
                                  )
                                }
                                className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
                              >
                                <IconCode size={16} /> JSON
                              </button>
                            </div>
                          )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          {bill.snp === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                <IconCheck size={16} /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                <IconX size={16} /> Reject
                              </button>
                              <button
                                onClick={() => handleHold(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              >
                                <IconClockPause size={16} /> Hold
                              </button>
                            </>
                          )}

                          {bill.snp === "Hold" && (
                            <>
                              <button
                                onClick={() => handleApprove(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                <IconCheck size={16} /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                <IconX size={16} /> Reject
                              </button>
                            </>
                          )}
                        </div>

                        {/* JSON View */}
                        {jsonViewId === bill.id && (
                          <pre className="mt-3 p-3 bg-gray-100 text-sm rounded overflow-x-auto">
                            {JSON.stringify(bill, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
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
