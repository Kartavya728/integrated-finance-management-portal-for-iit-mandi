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
  IconEye,
  IconListDetails,
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
}

export default function AuditDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [activeFilter, setActiveFilter] = useState<"All" | "Approved" | "Hold" | "Reject">("All");

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
    try {
      const { error } = await supabase
        .from("bills")
        .update({ audit: "Hold" })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? { ...b, audit: "Hold" } : b))
      );
    } catch (err) {
      console.error("Error putting bill on hold:", err);
    }
  };

  // Reject
  const handleReject = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from("bills")
        .update({ audit: "Reject" })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? { ...b, audit: "Reject" } : b))
      );
    } catch (err) {
      console.error("Error rejecting bill:", err);
    }
  };

  // filtered bills
  const filteredBills =
    activeFilter === "All"
      ? bills
      : bills.filter((b) => b.audit === activeFilter);

  const links = [
    {
      label: "All Bills",
      icon: <IconListDetails className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActiveFilter("All"),
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
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white md:flex-row",
        "h-screen shadow-lg"
      )}
    >
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
                    <span>{link.label}</span>
                  </button>
                )
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full mt-4"
              >
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl bg-gray-50 p-8 overflow-y-auto">
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

              {/* Bills Table */}
              {filteredBills.length === 0 ? (
                <p className="text-gray-500">No bills found.</p>
              ) : (
                <motion.table
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="min-w-full divide-y divide-gray-200 rounded-lg border bg-white shadow-sm"
                >
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        PO Details
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Audit
                      </th>
                      <th className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-800">
                          {bill.po_details}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {bill.supplier_name}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          ₹ {bill.po_value.toLocaleString()}
                        </td>
                        <td
                          className={cn(
                            "px-6 py-3 text-sm font-medium",
                            bill.audit === "Approved"
                              ? "text-green-600"
                              : bill.audit === "Reject"
                              ? "text-red-600"
                              : bill.audit === "Hold"
                              ? "text-yellow-600"
                              : "text-gray-500"
                          )}
                        >
                          {bill.audit}
                        </td>
                        <td className="px-6 py-3 text-sm text-right flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedBill(bill)}
                            className="flex items-center gap-1 px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            <IconEye size={16} /> View
                          </button>
                          {bill.audit !== "Approved" && (
                            <>
                              <button
                                onClick={() => handleApprove(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                <IconCheck size={16} /> Approve
                              </button>
                              <button
                                onClick={() => handleHold(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              >
                                <IconClockPause size={16} /> Hold
                              </button>
                              <button
                                onClick={() => handleReject(bill)}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                <IconX size={16} /> Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </motion.table>
              )}

              {/* Modal for details */}
              {selectedBill && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] relative">
                    <h2 className="text-lg font-semibold mb-4">
                      Bill Details – {selectedBill.po_details}
                    </h2>
                    <p><b>Supplier:</b> {selectedBill.supplier_name}</p>
                    <p><b>Value:</b> ₹ {selectedBill.po_value}</p>
                    <p><b>Description:</b> {selectedBill.item_description}</p>
                    <p><b>Quantity:</b> {selectedBill.qty}</p>
                    <p><b>Status:</b> {selectedBill.status}</p>
                    <p><b>Audit:</b> {selectedBill.audit}</p>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setSelectedBill(null)}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Sidebar Logos ------------------------- */
export const Logo = () => (
  <a href="#" className="relative z-20 flex items-center space-x-2 py-1 text-base font-semibold text-black">
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre text-black">
      IIT Mandi Finance
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a href="#" className="relative z-20 flex items-center py-1 text-sm font-semibold text-black">
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
  </a>
);
