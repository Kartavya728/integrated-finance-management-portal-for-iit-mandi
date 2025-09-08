"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut } from "next-auth/react";
import { IconArrowLeft, IconPlus, IconHistory } from "@tabler/icons-react";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/* ---------- Interfaces ---------- */
interface Bill {
  id: string;
  employee_id: string;
  employee_name: string;
  po_details: string | null;
  po_value: number | null;
  supplier_name: string | null;
  supplier_address: string | null;
  item_category: string | null;
  item_description: string | null;
  qty: number | null;
  bill_details: string | null;
  indenter_name: string | null;
  qty_issued: number | null;
  source_of_fund: string | null;
  stock_entry: string | null;
  location: string | null;
  remarks: string | null;
  remarks1: string | null;
  remarks2: string | null;
  remarks3: string | null;
  remarks4: string | null;
  created_at: string;
  status: string;
  snp: "Pending" | "Reject" | "Hold" | "Approved" | "NULL";
  audit: "Pending" | "Reject" | "Hold" | "Approved" | "NULL";
  finance_admin: string | null;
}

type PageView = "upload" | "history";

export default function EmployeeDashboard() {
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<PageView>("upload");
  const [balance, setBalance] = useState<number | null>(null);

  const [formData, setFormData] = useState<any>({
    employee_id: "",
    employee_name: "",
    po_details: "",
    po_value: "",
    supplier_name: "",
    supplier_address: "",
    item_category: "Minor",
    item_description: "",
    qty: "",
    bill_details: "",
    indenter_name: "",
    qty_issued: "",
    source_of_fund: "",
    stock_entry: "",
    location: "",
    remarks: "",
    remarks1: "",
    remarks2: "",
    remarks3: "",
    remarks4: "",
  });

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

  // Fetch PDA balance when employee_id changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!formData.employee_id) return;
      try {
        const { data, error } = await supabase
          .from("pda_balances")
          .select("balance")
          .eq("employee_id", formData.employee_id)
          .single();
        if (error) {
          console.error("Error fetching PDA balance:", error.message);
          setBalance(null);
        } else {
          setBalance(data?.balance || 0);
        }
      } catch (err) {
        console.error(err);
        setBalance(null);
      }
    };
    fetchBalance();
  }, [formData.employee_id]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const billValue = parseFloat(formData.po_value);

  // Required fields
  if (!formData.employee_id || !formData.employee_name) {
    alert("Employee ID and Name are required.");
    return;
  }

  if (isNaN(billValue) || billValue <= 0) {
    alert("Enter a valid bill amount.");
    return;
  }

  // Check PDA balance
  const { data: balanceData, error: balanceErr } = await supabase
    .from("pda_balances")
    .select("balance")
    .eq("employee_id", formData.employee_id)
    .single();

  if (balanceErr || !balanceData) {
    alert("Invalid Employee ID or no PDA balance found.");
    return;
  }

  const currentBalance = parseFloat(balanceData.balance);
  if (currentBalance < billValue) {
    alert("Insufficient PDA balance. Cannot submit bill.");
    return;
  }

  // Determine category, snp, audit
  let category = formData.item_category;
  let snp: "Pending" | "Reject" | "Hold" | "Approved" | null = null;
  let audit: "Pending" | "Reject" | "Hold" | "Approved" | null = null;

  if (billValue > 50000) {
    if (category === "Minor") {
      alert("Bills greater than ₹50,000 cannot be Minor.");
      return;
    }
    snp = "Pending";
    audit = null;
  } else {
    category = "Minor";
    snp = null;
    audit = "Pending";
  }

  // Normalize optional numeric fields
  const normalizedData: any = {
    ...formData,
    po_value: billValue,
    qty: formData.qty ? parseInt(formData.qty.toString()) : null,
    qty_issued: formData.qty_issued ? parseInt(formData.qty_issued.toString()) : null,
    item_category: category,
    snp,
    audit,
    status: "User",
    finance_admin: null, // must be null, not "NULL"
  };

  // Normalize empty strings to null for optional text fields
  const optionalFields = [
    "po_details",
    "supplier_name",
    "supplier_address",
    "item_description",
    "bill_details",
    "indenter_name",
    "source_of_fund",
    "stock_entry",
    "location",
    "remarks",
    "remarks1",
    "remarks2",
    "remarks3",
    "remarks4",
  ];

  optionalFields.forEach((field) => {
    if (!normalizedData[field] || normalizedData[field] === "") {
      normalizedData[field] = null;
    }
  });

  try {
    // Deduct PDA balance
    const { error: updateErr } = await supabase
      .from("pda_balances")
      .update({ balance: currentBalance - billValue, updated_at: new Date() })
      .eq("employee_id", formData.employee_id);

    if (updateErr) {
      console.error("Error updating PDA balance:", updateErr.message);
      alert("Error updating PDA balance.");
      return;
    }

    // Insert bill
    const { error: insertErr } = await supabase.from("bills").insert([normalizedData]);

    if (insertErr) {
      console.error("Failed to upload bill:", insertErr.message);
      alert(`Failed to upload bill: ${insertErr.message}`);
      return;
    }

    alert("Bill submitted successfully!");
    setFormData({
      employee_id: "",
      employee_name: "",
      po_details: "",
      po_value: "",
      supplier_name: "",
      supplier_address: "",
      item_category: "Minor",
      item_description: "",
      qty: "",
      bill_details: "",
      indenter_name: "",
      qty_issued: "",
      source_of_fund: "",
      stock_entry: "",
      location: "",
      remarks: "",
      remarks1: "",
      remarks2: "",
      remarks3: "",
      remarks4: "",
    });
    setBalance(null);
    setActivePage("history");
  } catch (err: any) {
    console.error("Unexpected error:", err.message || err);
    alert("Something went wrong. Please try again.");
  }
};


  /* ---------- Sidebar Links ---------- */
  const links = [
    {
      label: "Upload Bill",
      icon: <IconPlus className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActivePage("upload"),
    },
    {
      label: "Bills History",
      icon: <IconHistory className="h-5 w-5 shrink-0 text-indigo-600" />,
      onClick: () => setActivePage("history"),
    },
  ];

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
                    "flex items-center gap-2 px-3 py-2 rounded text-left w-full",
                    activePage === link.label.toLowerCase().replace(" ", "-") &&
                      "bg-gray-200 font-medium"
                  )}
                >
                  {link.icon}
                  {open && <span>{link.label}</span>}
                </button>
              ))}
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
      <div className="flex flex-1 p-6 overflow-y-auto bg-gray-50">
        {activePage === "upload" && (
          <div className="w-full max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Upload New Bill</h1>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-2 gap-4 bg-white shadow p-6 rounded-lg border"
            >
              {/* Keep all fields here, including dropdown for category */}
              {Object.keys(formData).map((field) => (
                <div key={field} className="col-span-1">
                  <label className="block text-gray-700 capitalize">
                    {field.replace(/_/g, " ")}
                  </label>
                  {field === "item_category" ? (
                    <select
                      value={formData[field]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    >
                      <option>Minor</option>
                      <option>Major</option>
                      <option>Consumables</option>
                    </select>
                  ) : (
                    <input
                      type={
                        field.includes("qty") || field.includes("value")
                          ? "number"
                          : "text"
                      }
                      value={formData[field]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field]: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                      required={
                        field === "employee_id" || field === "employee_name"
                      }
                    />
                  )}
                </div>
              ))}
              <div className="col-span-2">
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg shadow"
                >
                  Submit Bill
                </motion.button>
              </div>
              {balance !== null && (
                <div className="col-span-2 text-gray-600">
                  Current PDA Balance: ₹ {balance.toFixed(2)}
                </div>
              )}
            </form>
          </div>
        )}

        {activePage === "history" && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-6">All Bills History</h2>
            {loading ? (
              <p>Loading...</p>
            ) : bills.length === 0 ? (
              <p className="text-gray-500">No bills uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded bg-white shadow-sm text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2">Employee ID</th>
                      <th className="px-3 py-2">Employee Name</th>
                      <th className="px-3 py-2">PO Details</th>
                      <th className="px-3 py-2">PO Value</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">SNP</th>
                      <th className="px-3 py-2">Audit</th>
                      <th className="px-3 py-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{bill.employee_id}</td>
                        <td className="px-3 py-2">{bill.employee_name}</td>
                        <td className="px-3 py-2">{bill.po_details}</td>
                        <td className="px-3 py-2">₹ {bill.po_value}</td>
                        <td className="px-3 py-2">{bill.item_category}</td>
                        <td className="px-3 py-2">{bill.status}</td>
                        <td className="px-3 py-2">{bill.snp}</td>
                        <td className="px-3 py-2">{bill.audit}</td>
                        <td className="px-3 py-2">
                          {new Date(bill.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
      IIT Mandi Bills
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
