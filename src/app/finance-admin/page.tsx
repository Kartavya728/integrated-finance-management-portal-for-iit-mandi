"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
import {
  IconArrowLeft,
  IconUsers,
  IconList,
  IconHome,
  IconClockPause,
  IconFileText,
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
  remarks?: string;
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

  /* ---------- Actions ---------- */
  const handleApprove = async (bill: Bill) => {
    await supabase
      .from("bills")
      .update({ status: "Accepted", finance_admin: "Approved" })
      .eq("id", bill.id);
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? { ...b, status: "Accepted", finance_admin: "Approved" }
          : b
      )
    );
  };

  const handleHold = async (bill: Bill, remark: string) => {
    if (!remark.trim()) return alert("Please provide a remark before holding.");
    await supabase
      .from("bills")
      .update({ finance_admin: "Hold", remarks: remark })
      .eq("id", bill.id);
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id ? { ...b, finance_admin: "Hold", remarks: remark } : b
      )
    );
  };

  const handleReject = async (bill: Bill, remark: string) => {
    if (!remark.trim()) return alert("Please provide a remark before rejecting.");
    await supabase
      .from("bills")
      .update({ finance_admin: "Reject", remarks: remark })
      .eq("id", bill.id);
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? { ...b, finance_admin: "Reject", remarks: remark }
          : b
      )
    );
  };

  // Employee actions
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
                      activePage === link.label.toLowerCase().replace(" ", "-") &&
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
            <h1 className="text-2xl font-semibold mb-6">Finance Admin Dashboard</h1>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-6 mb-8">
              <motion.div className="rounded-lg bg-white shadow p-6 border">
                <h2 className="text-gray-600">Total Bills</h2>
                <p className="text-2xl font-bold">{totalBills}</p>
              </motion.div>
              <motion.div className="rounded-lg bg-green-100 shadow p-6 border">
                <h2 className="text-gray-600">Approved</h2>
                <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
              </motion.div>
              <motion.div className="rounded-lg bg-yellow-100 shadow p-6 border">
                <h2 className="text-gray-600">Hold</h2>
                <p className="text-2xl font-bold text-yellow-700">{holdCount}</p>
              </motion.div>
              <motion.div className="rounded-lg bg-red-100 shadow p-6 border">
                <h2 className="text-gray-600">Rejected</h2>
                <p className="text-2xl font-bold text-red-700">{rejectCount}</p>
              </motion.div>
              <motion.div className="rounded-lg bg-blue-100 shadow p-6 border">
                <h2 className="text-gray-600">Pending</h2>
                <p className="text-2xl font-bold text-blue-700">{pendingCount}</p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Review Bills Page */}
        {activePage === "review-bills" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">Review All Bills</h2>
            <table className="min-w-full divide-y divide-gray-200 border rounded bg-white shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3">PO Details</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{bill.po_details}</td>
                    <td className="px-6 py-3">{bill.supplier_name}</td>
                    <td className="px-6 py-3">₹ {bill.po_value}</td>
                    <td className="px-6 py-3">{bill.finance_admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hold Bills Page */}
        {activePage === "hold-bills" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">All Hold Bills (Any Dept)</h2>
            {bills.filter((b) => b.snp === "Hold" || b.audit === "Hold" || b.finance_admin === "Hold").length === 0 ? (
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
                    .filter((b) => b.snp === "Hold" || b.audit === "Hold" || b.finance_admin === "Hold")
                    .map((bill) => (
                      <tr key={bill.id}>
                        <td className="px-6 py-3">{bill.po_details}</td>
                        <td className="px-6 py-3">{bill.status}</td>
                        <td className="px-6 py-3">{bill.remarks || "-"}</td>
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
              className="mb-4 px-4 py-2 rounded bg-blue-600 text-white"
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
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-6 py-3">{emp.username}</td>
                    <td className="px-6 py-3">{emp.name}</td>
                    <td className="px-6 py-3">{emp.email}</td>
                    <td className="px-6 py-3">
                      <select
                        value={emp.department}
                        disabled={editingEmployee !== emp.id ? true : false}
                        onChange={(e) => handleUpdateDepartment(emp.id, e.target.value)}
                        className="border p-1 rounded"
                      >
                        <option>User</option>
                        <option>Student Purchase</option>
                        <option>Audit</option>
                        <option>Finance Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {editingEmployee === emp.id ? (
                        <button
                          onClick={() =>
                            handleUpdateDepartment(emp.id, emp.department)
                          }
                          className="px-3 py-1 rounded bg-green-100 text-green-700"
                        >
                          Save
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingEmployee(emp.id)}
                            className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="px-3 py-1 rounded bg-red-100 text-red-700"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Sidebar Logos ------------------------- */
export const Logo = () => (
  <a
    href="#"
    className="flex items-center space-x-2 py-1 text-base font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      IIT Mandi Finance
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a
    href="#"
    className="flex items-center py-1 text-sm font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
  </a>
);
