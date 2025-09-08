"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
import {
  IconArrowLeft,
  IconUsers,
  IconList,
  IconHome,
  IconClockPause,
  IconFileText,
  IconCheck,
  IconX,
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
  remarks?: string; // finance remark
  remarks1?: string; // audit remark
  remarks2?: string; // snp remark
}

interface Employee {
  id: string;
  username: string;
  name: string;
  email: string;
  department: string;
}

type PageView = "dashboard" | "review-bills" | "hold-bills" | "employees";

export default function FinanceAdminDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const [bills, setBills] = useState<Bill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePage, setActivePage] = useState<PageView>("dashboard");

  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);

  // for bill actions
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
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
        setBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // fetch employees
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    if (activePage === "employees") fetchEmployees();
  }, [activePage]);

  /* ---------- Bill Actions ---------- */
  const handleApprove = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from("bills")
        .update({ status: "Accepted", finance_admin: "Approved" })
        .eq("id", bill.id);
      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, status: "Accepted", finance_admin: "Approved" }
            : b
        )
      );
    } catch (err) {
      console.error("Error approving bill:", err);
    }
  };

  const handleHold = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before holding.");
      return;
    }
    try {
      const { error } = await supabase
        .from("bills")
        .update({ finance_admin: "Hold", remarks: remarks[bill.id] })
        .eq("id", bill.id);
      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, finance_admin: "Hold", remarks: remarks[bill.id] }
            : b
        )
      );
    } catch (err) {
      console.error("Error holding bill:", err);
    }
  };

  const handleReject = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before rejecting.");
      return;
    }
    try {
      const { error } = await supabase
        .from("bills")
        .update({ finance_admin: "Reject", remarks: remarks[bill.id] })
        .eq("id", bill.id);
      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, finance_admin: "Reject", remarks: remarks[bill.id] }
            : b
        )
      );
    } catch (err) {
      console.error("Error rejecting bill:", err);
    }
  };

  /* ---------- Employee Actions ---------- */
  const handleDeleteEmployee = async (id: string) => {
    await supabase.from("employees").delete().eq("id", id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateDepartment = async (id: string, dept: string) => {
    await supabase.from("employees").update({ department: dept }).eq("id", id);
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, department: dept } : e))
    );
    setEditingEmployee(null);
  };

  const handleAddEmployee = async () => {
    const username = prompt("Enter username:");
    const name = prompt("Enter name:");
    const email = prompt("Enter email:");
    const department = prompt("Enter department:");
    if (!username || !name) return;
    const { data, error } = await supabase
      .from("employees")
      .insert([{ username, name, email, department }])
      .select();
    if (!error && data) setEmployees((prev) => [...prev, ...data]);
  };

  /* ---------- Stats ---------- */
  const totalBills = bills.length;
  const approvedCount = bills.filter((b) => b.finance_admin === "Approved").length;
  const holdCount = bills.filter((b) => b.finance_admin === "Hold").length;
  const rejectCount = bills.filter((b) => b.finance_admin === "Reject").length;
  const pendingCount = bills.filter((b) => b.finance_admin === "Pending").length;

  /* ---------- Sidebar Links ---------- */
  const links = [
    {
      label: "Dashboard",
      icon: <IconList className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActivePage("dashboard"),
    },
    {
      label: "Review Bills",
      icon: <IconFileText className="h-5 w-5 shrink-0 text-indigo-600" />,
      onClick: () => setActivePage("review-bills"),
    },
    {
      label: "Hold Bills",
      icon: <IconClockPause className="h-5 w-5 shrink-0 text-yellow-600" />,
      onClick: () => setActivePage("hold-bills"),
    },
    {
      label: "Manage Employees",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-green-600" />,
      onClick: () => setActivePage("employees"),
    },
    {
      label: "Back to User Page",
      href: "/user",
      icon: <IconHome className="h-5 w-5 shrink-0 text-blue-600" />,
    },
  ];

  /* ---------- Render Pages ---------- */
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
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
                      activePage ===
                        link.label.toLowerCase().replace(" ", "-") &&
                        "bg-gray-200 font-medium"
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
      <div className="flex flex-1 p-4 overflow-y-auto bg-gray-50">
        {activePage === "dashboard" && (
          <div className="w-full">
            <h1 className="text-2xl font-semibold mb-6">
              Finance Admin Dashboard
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-6 mb-8">
              <motion.div className="rounded-lg bg-white shadow p-6 border">
                <h2 className="text-gray-600">Total Bills</h2>
                <p className="text-2xl font-bold">{totalBills}</p>
              </motion.div>
              <motion.div className="rounded-lg bg-green-100 shadow p-6 border">
                <h2 className="text-gray-600">Approved</h2>
                <p className="text-2xl font-bold text-green-700">
                  {approvedCount}
                </p>
              </motion.div>
              <motion.div className="rounded-lg bg-yellow-100 shadow p-6 border">
                <h2 className="text-gray-600">Hold</h2>
                <p className="text-2xl font-bold text-yellow-700">
                  {holdCount}
                </p>
              </motion.div>
              <motion.div className="rounded-lg bg-red-100 shadow p-6 border">
                <h2 className="text-gray-600">Rejected</h2>
                <p className="text-2xl font-bold text-red-700">
                  {rejectCount}
                </p>
              </motion.div>
              <motion.div className="rounded-lg bg-blue-100 shadow p-6 border">
                <h2 className="text-gray-600">Pending</h2>
                <p className="text-2xl font-bold text-blue-700">
                  {pendingCount}
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Review Bills Page */}
        {activePage === "review-bills" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">Review All Bills</h2>

            {loading ? (
              <p>Loading bills...</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bills.map((bill) => {
                  const isExpanded = expandedBill === bill.id;
                  const locked =
                    bill.finance_admin === "Approved" ||
                    bill.finance_admin === "Reject";

                  return (
                    <div
                      key={bill.id}
                      className={cn(
                        "rounded-lg p-4 shadow cursor-pointer bg-white",
                        bill.finance_admin === "Approved"
                          ? "border-4 border-green-500"
                          : bill.finance_admin === "Reject"
                          ? "border-4 border-red-500"
                          : bill.finance_admin === "Hold"
                          ? "border-4 border-yellow-500"
                          : "border border-gray-300"
                      )}
                      onClick={() =>
                        setExpandedBill(isExpanded ? null : bill.id)
                      }
                    >
                      <h2 className="text-lg font-semibold text-gray-800">
                        {bill.po_details} – {bill.supplier_name}
                      </h2>
                      <p className="text-gray-600">Value: ₹ {bill.po_value}</p>
                      <p className="text-sm font-medium">
                        Status: {bill.finance_admin} at Finance Admin
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
                            {bill.remarks && (
                              <p className="font-bold text-gray-700">
                                Finance Remark: {bill.remarks}
                              </p>
                            )}
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

                            {/* Action Buttons */}
                            {!locked && (
                              <div className="flex gap-3 mt-3">
                                {bill.finance_admin === "Pending" && (
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
                                {bill.finance_admin === "Hold" && (
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
          </div>
        )}

        {/* Hold Bills Page */}
        {activePage === "hold-bills" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">
              All Hold Bills (Any Dept)
            </h2>
            {bills.filter(
              (b) =>
                b.snp === "Hold" ||
                b.audit === "Hold" ||
                b.finance_admin === "Hold"
            ).length === 0 ? (
              <p className="text-gray-500">No hold bills</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 border rounded bg-white shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3">PO Details</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {bills
                    .filter(
                      (b) =>
                        b.snp === "Hold" ||
                        b.audit === "Hold" ||
                        b.finance_admin === "Hold"
                    )
                    .map((bill) => (
                      <tr key={bill.id}>
                        <td className="px-6 py-3">{bill.po_details}</td>
                        <td className="px-6 py-3">{bill.status}</td>
                        <td className="px-6 py"></td>
                        <td className="px-6 py-3">
                          {bill.remarks || bill.remarks1 || bill.remarks2 || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Employees Page */}
        {activePage === "employees" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">Manage Employees</h2>
            <button
              onClick={handleAddEmployee}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Employee
            </button>
            <table className="min-w-full divide-y divide-gray-200 border rounded bg-white shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-6 py-3">{emp.username}</td>
                    <td className="px-6 py-3">{emp.name}</td>
                    <td className="px-6 py-3">{emp.email}</td>
                    <td className="px-6 py-3">
                      {editingEmployee === emp.id ? (
                        <select
                          value={emp.department}
                          onChange={(e) =>
                            handleUpdateDepartment(emp.id, e.target.value)
                          }
                          className="border px-2 py-1 rounded"
                        >
                          <option value="Finance Admin">Finance Admin</option>
                          <option value="Finance Employee">
                            Finance Employee
                          </option>
                          <option value="Audit">Audit</option>
                          <option value="Student Purchase">
                            Student Purchase
                          </option>
                          <option value="User">User</option>
                        </select>
                      ) : (
                        emp.department
                      )}
                    </td>
                    <td className="px-6 py-3 space-x-2">
                      {editingEmployee === emp.id ? (
                        <button
                          onClick={() => setEditingEmployee(null)}
                          className="px-3 py-1 bg-gray-200 rounded"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingEmployee(emp.id)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Modal */}
      <AnimatePresence>
        {jsonView && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <pre className="whitespace-pre-wrap text-sm max-h-[500px] overflow-y-auto">
                {jsonView}
              </pre>
              <button
                onClick={() => setJsonView(null)}
                className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                <IconX className="h-5 w-5 text-gray-700" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Sidebar Branding ---------- */
const Logo = () => (
  <div className="flex items-center gap-2">
    <IconCheck className="h-6 w-6 text-blue-600" />
    <span className="font-semibold text-lg">Finance Admin</span>
  </div>
);

const LogoIcon = () => (
  <div className="flex items-center justify-center">
    <IconCheck className="h-6 w-6 text-blue-600" />
  </div>
);
