"use client";
import { signOut, useSession, signIn } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { sendBillRemarkNotification } from "../../helpers/emailService";
import {
  IconArrowLeft,
  IconUsers,
  IconList,
  IconHome,
  IconClockPause,
  IconFileText,
  IconCheck,
  IconX,
  IconEye,
  IconEdit,
  IconTrash,
  IconPlus,
  IconLock,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import EditEmployeeForm from "@/components/EditEmployeeForm";
import BillCard from "@/components/BillCard";

// Allowed departments
const DEPARTMENTS = [
  "Staff Recruitment Section",
  "Dean Infrastructure (I&S)/Land Acquisition",
  "Dean Resource Generation & Alumni Relations",
  "Central Dak Section",
  "Health Center",
  "School of Computing & Electrical Engineering",
  "School of Chemical Sciences",
  "School of Physical Sciences",
  "School of Mathematical & Statistical Sciences",
  "School of Biosciences & Bio Engineering",
  "School of Mechanical & Materials Engineering",
  "School of Civil & Environmental Engineering",
  "School of Humanities & Social Sciences",
  "School of Management",
  "Advanced Materials Research Center (AMRC)",
  "Centre of Artificial Intelligence and Robotics (CAIR)",
  "Center for Quantum Science and Technologies (CQST)",
  "Centre for Design & Fabrication of Electronic Devices (C4DFED)",
  "Center for Human-Computer Interaction (CHCI)",
  "Center for Climate Change and Disaster Management (C3DAR)",
  "IIT Mandi i-Hub & HCI",
  "IKSMHA Center",
  "Centre for Continuing Education (CCE)",
  "JEE CELL",
  "JAM",
  "GATE",
  "Office of Chief Warden",
  "Parashar Hostel",
  "Chandertaal Hostel",
  "Suvalsar Hostel",
  "Nako Hostel",
  "Dashir Hostel",
  "Beas Kund Hostel",
  "Manimahesh Hostel",
  "Suraj Taal Hostel",
  "Gauri Kund Hostel",
  "Central Mess",
  "Sports",
  "NSS",
  "Guidance & Counselling Cell",
  "Construction & Maintainance Cell",
  "Transportation",
  "Guest House",
  "Housekeeping Services & Waste Management",
  "Creche",
  "Security Unit",
  "Common Rooms",
  "Career & Placement Cell",
  "IIT Mandi Catalyst",
  "Recreation Center",
  "CPWD",
  "Banks",
  "IPDC",
  "IR",
  "Mind Tree School",
  "Renuka Hostel",
  "Rewalsar",
  "Director Office",
  "Deans",
  "Associate Deans",
  "Registrar Office",
  "Administration and Establishment Section",
  "Faculty Establishment and Recruitment",
  "Finance and Accounts",
  "Store and Purchase Section",
  "Rajbhasa Section",
  "Ranking Cell (RC)",
  "Media Cell",
  "Academics Section",
  "Academic Affairs",
  "Research Affairs",
  "Legal Section",
  "Internal Audit",
  "Central Library",
  "DIGITAL AND COMPUTING SERVICES",
  "Dean (SRIC & IR ) Office",
  "Dean (Students) Office",
];

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
  employee_name: string;
  item_description?: string;
  item_category?: string;
  qty?: number;
  remarks?: string; // finance remark
  remarks1?: string; // snp remark
  remarks2?: string; // audit remark
  remarks3?: string; // other remark
  remarks4?: string; // additional remark
  has_bank_guarantee?: boolean;
  bank_guarantee_details?: string;
  bank_guarantee_amount?: number;
  date_of_installation?: string;
  date_of_delivery?: string;
}

interface Employee {
  id: string;
  username: string;
  name: string;
  email: string;
  department: string;
  employee_type: string;
  employee_code: string;
}

type PageView = "dashboard" | "review-bills" | "hold-bills" | "employees";

export default function FinanceAdminDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const [bills, setBills] = useState<Bill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePage, setActivePage] = useState<PageView>("dashboard");

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<string>("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // for bill actions
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState<Bill | null>(null);

  // Add employee form
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employee_name: "",
    email: "",
    employee_type: "Finance Employee",
    department: "Finance and Accounts",
    employee_code: "",
  });

  //const FINANCE_ADMIN_PASSWORD = "admin123"; // In production, this should be in environment variables

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
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order('created_at', { ascending: false });  // Order by created_at descending
      
      if (error) throw error;
      
      // Additional client-side sort as fallback
     const sortedData = (data || []).sort((a, b) => {
       const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
       const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
       return dateB - dateA;
     });
      
      setEmployees(sortedData);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    if (activePage === "employees") fetchEmployees();
  }, [activePage]);

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleSaveEmployee = async (updatedEmployee: Employee) => {
    console.log("handleSaveEmployee: payload =", updatedEmployee);
    try {
      if (!updatedEmployee?.id) {
        throw new Error("Missing employee id - cannot update");
      }

      // validate/normalize department to match Postgres enum values
      const deptToUpdate = normalizeDepartment(updatedEmployee.department);
      if (updatedEmployee.department && deptToUpdate === null) {
        console.warn("Invalid department provided, will set to null:", updatedEmployee.department);
      }

      const { error, data } = await supabase
        .from("employees")
        .update({
          employee_name: updatedEmployee.name ?? updatedEmployee.username ?? null,
          email: updatedEmployee.email,
          department: deptToUpdate,
          employee_type: updatedEmployee.employee_type,
          employee_code: updatedEmployee.employee_code,
        })
        .eq("id", updatedEmployee.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
      }

      console.log("Employee updated:", data);
      setEmployees((prev) => prev.map((e) => (e.id === (data as Employee).id ? (data as Employee) : e)));
      setEditingEmployee(null);
    } catch (err: any) {
      console.error("Failed to update employee", err);
      console.info("Next checks: confirm `updatedEmployee.id` is correct, verify RLS policies on `employees` table allow UPDATE for your client key, or test update from Supabase SQL editor / server-side function.");
      throw err;
    }
  };

  /* ---------- Password Protection ---------- */
  const handlePasswordAction = (action: string, employeeId?: string) => {
    setPasswordAction(action);
    setTargetEmployeeId(employeeId || "");
    setShowPasswordModal(true);
    setEnteredPassword("");
  };

  const verifyPassword = async () => {
      // We need the user's username to re-authenticate.
      // This assumes the username is stored in the session.
      // Check your console.log(session.user) to see if it's 'username', 'email', or 'name'
      const loginIdentifier = session?.user?.username || session?.user?.email;

      if (!loginIdentifier) {
        alert("Error: Could not find user identifier in session. Please log out and log in again.");
        return false;
      }

      setIsVerifying(true);

      // Use the exact same 'signIn' method as the login page
      const res = await signIn("credentials", {
        redirect: false, // Tells NextAuth not to redirect the page
        username: loginIdentifier, // Use the logged-in user's username/email
        password: enteredPassword, // Use the password from the modal
      });

      setIsVerifying(false);

      if (res?.error) {
        console.error("Re-authentication failed:", res.error);
        alert("Incorrect password! Please try again.");
        return false;
      }

      // Password is correct
      setShowPasswordModal(false);
      setEnteredPassword("");
      return true;
    };
  const executePasswordProtectedAction = async () => {
    const isVerified = await verifyPassword();
    if (!isVerified) return;

    switch (passwordAction) {
      case "delete":
        if (targetEmployeeId) {
          await handleDeleteEmployee(targetEmployeeId);
        }
        break;
      case "add":
        setShowAddEmployeeForm(true);
        break;
      case "edit":
        if (targetEmployeeId) {
          const employeeToEdit = employees.find((e) => e.id === targetEmployeeId);
          if (employeeToEdit) {
            setEditingEmployee(employeeToEdit);
          }
        }
        break;
    }
    // Clear password modal state
    setShowPasswordModal(false);
    setEnteredPassword("");
    setPasswordAction("");
    setTargetEmployeeId("");
  };

  /* ---------- Bill Actions ---------- */
  const handleApprove = async (bill: Bill) => {
    try {
      const remarkText = remarks[bill.id] || bill.remarks || "Approved by Finance Admin";
      const remarkWithUser = `${remarkText} (By: ${session?.user?.name || 'Finance Admin'} at ${new Date().toLocaleString()})`;
      
      const { error } = await (supabase as any)
        .from("bills")
        .update({ 
          status: "Accepted", 
          finance_admin: "Approved",
          remarks: remarkWithUser
        })
        .eq("id", bill.id);
      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, status: "Accepted", finance_admin: "Approved", remarks: remarkWithUser }
            : b
        )
      );

      // No email notification for Approve
      alert("Bill approved successfully!");
    } catch (err) {
      console.error("Error approving bill:", err);
      alert("Error approving bill");
    }
  };

  const handleHold = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before holding.");
      return;
    }
    try {
      const remarkWithUser = `${remarks[bill.id]} (By: ${session?.user?.name || 'Finance Admin'} at ${new Date().toLocaleString()})`;
      const { error } = await (supabase as any)
        .from("bills")
        .update({ 
          finance_admin: "Hold", 
          remarks: remarkWithUser 
        })
        .eq("id", bill.id);
      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, finance_admin: "Hold", remarks: remarkWithUser }
            : b
        )
      );

      // Send email notification
      await sendBillRemarkNotification({
        billId: bill.id,
        department: 'Finance Admin',
        remark: remarks[bill.id],
        action: 'Hold',
        timestamp: new Date().toLocaleString()
      });

      alert("Bill put on hold! Email notification sent to employee.");
    } catch (err) {
      console.error("Error holding bill:", err);
      alert("Error holding bill");
    }
  };

  const handleReject = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before rejecting.");
      return;
    }
    try {
      const remarkWithUser = `${remarks[bill.id]} (By: ${session?.user?.name || 'Finance Admin'} at ${new Date().toLocaleString()})`;
      const { error } = await (supabase as any)
        .from("bills")
        .update({ 
          finance_admin: "Reject", 
          remarks: remarkWithUser 
        })
        .eq("id", bill.id);
      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, finance_admin: "Reject", remarks: remarkWithUser }
            : b
        )
      );

      // Send email notification
      await sendBillRemarkNotification({
        billId: bill.id,
        department: 'Finance Admin',
        remark: remarks[bill.id],
        action: 'Reject',
        timestamp: new Date().toLocaleString()
      });

      alert("Bill rejected! Email notification sent to employee.");
    } catch (err) {
      console.error("Error rejecting bill:", err);
      alert("Error rejecting bill");
    }
  };

  /* ---------- Employee Actions ---------- */
  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
      
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      alert("Employee deleted successfully!");
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Error deleting employee");
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { error } = await (supabase as any)
        .from("employees")
        .update({
          username: updates.username,
          name: updates.name,
          email: updates.email,
          department: updates.department,
        })
        .eq("id", id);
      if (error) throw error;

      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
      setEditingEmployee(null);
      alert("Employee updated successfully!");
    } catch (err) {
      console.error("Error updating employee:", err);
      alert("Error updating employee");
    }
  };

  const handleNewEmployeeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Modify handleAddEmployee to use form submit
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form from submitting normally
    try {
      if (!newEmployee.employee_name || !newEmployee.email || !newEmployee.employee_code) {
        alert("Employee name, email, and code are required!");
        return;
      }

      // normalize department for insert
      const deptToInsert = normalizeDepartment(newEmployee.department);
      if (newEmployee.department && deptToInsert === null) {
        console.warn("Invalid department provided on add, will insert null:", newEmployee.department);
      }

      const { error } = await supabase
        .from("employees")
        .insert({
          employee_name: newEmployee.employee_name,
          email: newEmployee.email,
          employee_type: newEmployee.employee_type,
          department: deptToInsert,
          employee_code: newEmployee.employee_code,
        });

      if (error) throw error;
      
      await fetchEmployees();
      setNewEmployee({
        employee_name: "",
        email: "",
        employee_type: "Finance Employee",
        department: "Finance and Accounts",
        employee_code: "",
      });
      setShowAddEmployeeForm(false);
      alert("Employee added successfully!");
    } catch (err) {
      console.error("Error adding employee:", err);
      alert("Error adding employee");
    }
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
      label: "All Bills",
      icon: <IconFileText className="h-5 w-5 shrink-0 text-indigo-500" />,
      onClick: () => window.location.assign("/bills"),
    },
    {
      label: "Manage Employees",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-green-600" />,
      onClick: () => setActivePage("employees"),
    },
  ];

  const formatBillDetails = (bill: Bill) => {
    return {
      basicInfo: {
        id: bill.id,
        employeeId: bill.employee_id,
        employeeName: bill.employee_name,
        submittedAt: bill.created_at ? new Date(bill.created_at).toLocaleString() : "N/A",
      },
      purchaseDetails: {
        poDetails: bill.po_details || "N/A",
        supplierName: bill.supplier_name || "N/A",
        itemDescription: bill.item_description || "N/A",
        itemCategory: bill.item_category || "N/A",
        quantity: bill.qty || 0,
        totalValue: bill.po_value || 0,
      },
      workflowStatus: {
        overall: bill.status,
        snpStatus: bill.snp || "N/A",
        auditStatus: bill.audit || "N/A",
        financeAdminStatus: bill.finance_admin || "N/A",
      },
      departmentRemarks: {
        snp: bill.remarks1 || "No remark",
        audit: bill.remarks2 || "No remark", 
        financeAdmin: bill.remarks || "No remark",
        other: bill.remarks3 || "No remark",
        additional: bill.remarks4 || "No remark",
      }
    };
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <button
                  key={idx}
                  onClick={link.onClick}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded text-left w-full transition-colors",
                    activePage === link.label.toLowerCase().replace(" ", "-") 
                      ? "bg-blue-100 font-medium text-blue-900" 
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="min-w-[24px] flex justify-center">
                    {link.icon}
                  </div>
                  <span className={cn(
                    "transition-all duration-200", 
                    open ? "opacity-100" : "opacity-0 md:hidden"
                  )}>
                    {link.label}
                  </span>
                </button>
              ))}

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full mt-4"
              >
                <div className="min-w-[24px] flex justify-center">
                  <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
                </div>
                <span className={cn(
                  "transition-all duration-200", 
                  open ? "opacity-100" : "opacity-0 md:hidden"
                )}>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 p-4 overflow-y-auto bg-gray-50">
        {activePage === "dashboard" && (
          <div className="w-full">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold mb-6"
            >
              Finance Admin Dashboard
            </motion.h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-lg bg-white shadow p-6 border"
              >
                <h2 className="text-gray-600 text-sm">Total Bills</h2>
                <p className="text-2xl font-bold text-gray-900">{totalBills}</p>
                <p className="text-xs text-gray-500 mt-1">All submissions</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg bg-green-50 shadow p-6 border border-green-200"
              >
                <h2 className="text-gray-600 text-sm">Approved</h2>
                <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Ready for payment</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg bg-yellow-50 shadow p-6 border border-yellow-200"
              >
                <h2 className="text-gray-600 text-sm">Hold</h2>
                <p className="text-2xl font-bold text-yellow-700">{holdCount}</p>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-lg bg-red-50 shadow p-6 border border-red-200"
              >
                <h2 className="text-gray-600 text-sm">Rejected</h2>
                <p className="text-2xl font-bold text-red-700">{rejectCount}</p>
                <p className="text-xs text-gray-500 mt-1">Not approved</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-lg bg-blue-50 shadow p-6 border border-blue-200"
              >
                <h2 className="text-gray-600 text-sm">Pending</h2>
                <p className="text-2xl font-bold text-blue-700">{pendingCount}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg shadow border p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Recent Bills</h2>
              {bills.slice(0, 5).length === 0 ? (
                <p className="text-gray-500">No recent bills</p>
              ) : (
                <div className="space-y-4">
                  {bills.slice(0, 5).map((bill) => (
                    <BillCard key={bill.id} bill={bill} showBankGuarantee={true} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Review Bills Page */}
        {activePage === "review-bills" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">Review Bills</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading bills...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {bills
                  .filter(bill => 
                    bill.finance_admin === "Pending" || 
                    bill.finance_admin === "Hold" || 
                    (bill.status === "Finance Admin" && (bill.finance_admin === null || bill.finance_admin === undefined))
                  )
                  .map((bill, index) => {
                    const locked = bill.finance_admin === "Approved" || bill.finance_admin === "Reject";

                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <BillCard bill={bill} showBankGuarantee={true} />

                        {/* Finance Admin Actions */}
                        {!locked && (
                          <div className="mt-4 bg-white rounded-lg shadow p-4 border border-gray-200">
                            <div className="space-y-3">
                              {/* Previous Remarks */}
                              {(bill.remarks1 || bill.remarks2) && (
                                <div className="bg-gray-50 rounded p-3">
                                  <p className="text-sm font-medium mb-2">Previous Department Remarks:</p>
                                  {bill.remarks1 && (
                                    <p className="text-xs text-gray-700 mb-1">
                                      <span className="font-medium">SNP:</span> {bill.remarks1}
                                    </p>
                                  )}
                                  {bill.remarks2 && (
                                    <p className="text-xs text-gray-700">
                                      <span className="font-medium">Audit:</span> {bill.remarks2}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Current Finance Admin Remark */}
                              {bill.remarks && (
                                <div className="bg-blue-50 rounded p-3">
                                  <p className="text-sm font-medium mb-1">Your Current Remark:</p>
                                  <p className="text-sm text-gray-700">{bill.remarks}</p>
                                </div>
                              )}

                              {/* Remark Input */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Enter your remark..."
                                  value={remarks[bill.id] || ""}
                                  onChange={(e) =>
                                    setRemarks((prev) => ({
                                      ...prev,
                                      [bill.id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={() => handleApprove(bill)}
                                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                  <IconCheck size={16} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleHold(bill)}
                                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                                >
                                  <IconClockPause size={16} />
                                  Hold
                                </button>
                                <button
                                  onClick={() => handleReject(bill)}
                                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  <IconX size={16} />
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Hold Bills Page */}
        {activePage === "hold-bills" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">Hold Bills (All Departments)</h2>
            
            {bills.filter(
              (b) => b.snp === "Hold" || b.audit === "Hold" || b.finance_admin === "Hold"
            ).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <IconClockPause className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No bills on hold</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hold By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remark
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills
                      .filter((b) => b.snp === "Hold" || b.audit === "Hold" || b.finance_admin === "Hold")
                      .map((bill) => {
                        const holdDepartment = 
                          bill.finance_admin === "Hold" ? "Finance Admin" :
                          bill.audit === "Hold" ? "Audit" :
                          bill.snp === "Hold" ? "SNP" : "Unknown";
                        
                        const holdRemark = 
                          bill.finance_admin === "Hold" ? bill.remarks :
                          bill.audit === "Hold" ? bill.remarks2 :
                          bill.snp === "Hold" ? bill.remarks1 : "No remark";

                        return (
                          <tr key={bill.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {bill.item_description || "No description"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {bill.supplier_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {bill.employee_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{bill.po_value?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                {holdDepartment}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {holdRemark || "No remark"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedBillDetails(bill);
                                  setShowDetailModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                <IconEye size={16} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Employees Management Page */}
        {activePage === "employees" && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Manage Employees</h2>
              <button
                onClick={() => handlePasswordAction("add")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconPlus size={20} />
                Add Employee
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.employee_code ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.email ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.employee_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingEmployee?.id === emp.id ? (
                          <button
                            onClick={() => setEditingEmployee(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handlePasswordAction("edit", emp.id)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <IconEdit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handlePasswordAction("delete", emp.id)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-2"
                            >
                              <IconTrash size={16} />
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
          </div>
        )}
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <IconLock className="text-red-600" />
                <h3 className="text-lg font-semibold">Enter Finance Admin Password</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This action requires Finance Admin authorization.
              </p>
              <input
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                onKeyPress={(e) => e.key === "Enter" && executePasswordProtectedAction()}
              />
              <div className="flex gap-2">
                <button
                  onClick={executePasswordProtectedAction}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setEnteredPassword("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddEmployeeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Add New Employee</h2>
              <form onSubmit={handleAddEmployee} className="space-y-6">
                <div>
                  <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="employee_name"
                    name="employee_name"
                    value={newEmployee.employee_name}
                    onChange={handleNewEmployeeChange}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={handleNewEmployeeChange}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="employee_type" className="block text-sm font-medium text-gray-700">Employee Type</label>
                  <select
                    id="employee_type"
                    name="employee_type"
                    value={newEmployee.employee_type}
                    onChange={handleNewEmployeeChange}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="Finance Employee">Finance Employee</option>
                    <option value="faculty">faculty</option>
                    <option value="staff">staff</option>
                    <option value="Student Purchase">Student Purchase</option>
                    <option value="bill_employee_edit">bill_employee_edit</option>
                    <option value="bill_employee_fill">bill_employee_fill</option>
                    <option value="pda-manager">pda-manager</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={newEmployee.department}
                    onChange={handleNewEmployeeChange}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="employee_code" className="block text-sm font-medium text-gray-700">Employee Code</label>
                  <input
                    type="text"
                    id="employee_code"
                    name="employee_code"
                    value={newEmployee.employee_code}
                    onChange={handleNewEmployeeChange}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 aorder border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeForm(false)}
                    className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedBillDetails && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Bill Details</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBillDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <IconX size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {(() => {
                  const details = formatBillDetails(selectedBillDetails);
                  return (
                    <>
                      {/* Basic Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="font-medium">Bill ID:</span> {details.basicInfo.id}</div>
                          <div><span className="font-medium">Employee ID:</span> {details.basicInfo.employeeId}</div>
                          <div><span className="font-medium">Employee Name:</span> {details.basicInfo.employeeName}</div>
                          <div><span className="font-medium">Submitted:</span> {details.basicInfo.submittedAt}</div>
                        </div>
                      </div>

                      {/* Purchase Details */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Purchase Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="font-medium">PO Details:</span> {details.purchaseDetails.poDetails}</div>
                          <div><span className="font-medium">Supplier:</span> {details.purchaseDetails.supplierName}</div>
                          <div><span className="font-medium">Category:</span> {details.purchaseDetails.itemCategory}</div>
                          <div><span className="font-medium">Quantity:</span> {details.purchaseDetails.quantity}</div>
                          <div className="col-span-2"><span className="font-medium">Description:</span> {details.purchaseDetails.itemDescription}</div>
                          <div><span className="font-medium">Total Value:</span> ₹{details.purchaseDetails.totalValue.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Workflow Status */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Workflow Status</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="font-medium">Overall Status:</span> {details.workflowStatus.overall}</div>
                          <div><span className="font-medium">SNP Status:</span> {details.workflowStatus.snpStatus}</div>
                          <div><span className="font-medium">Audit Status:</span> {details.workflowStatus.auditStatus}</div>
                          <div><span className="font-medium">Finance Admin:</span> {details.workflowStatus.financeAdminStatus}</div>
                        </div>
                      </div>

                      {/* Department Remarks */}
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Department Remarks</h4>
                        <div className="space-y-2 text-sm">
                          <div className="bg-white p-2 rounded">
                            <span className="font-medium">SNP:</span> {details.departmentRemarks.snp}
                          </div>
                          <div className="bg-white p-2 rounded">
                            <span className="font-medium">Audit:</span> {details.departmentRemarks.audit}
                          </div>
                          <div className="bg-white p-2 rounded">
                            <span className="font-medium">Finance Admin:</span> {details.departmentRemarks.financeAdmin}
                          </div>
                          {details.departmentRemarks.other !== "No remark" && (
                            <div className="bg-white p-2 rounded">
                              <span className="font-medium">Other:</span> {details.departmentRemarks.other}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingEmployee && (
        <EditEmployeeForm
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onCancel={() => setEditingEmployee(null)}
        />
      )}
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

// helper to normalize department before sending to DB
// accept only exact matches from the allowed DEPARTMENTS list
const normalizeDepartment = (raw?: string | null) => {
  if (!raw) return null;
  return DEPARTMENTS.includes(raw) ? raw : null;
};