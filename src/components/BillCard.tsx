"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabase/client";
import { signOut, useSession } from "next-auth/react";
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
  snp: "Pending" | "Reject" | "Hold" | "Approved" | null;
  audit: "Pending" | "Reject" | "Hold" | "Approved" | null;
  finance_admin: string | null;
}

type PageView = "upload" | "history";

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<PageView>("upload");
  const [balance, setBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  });

  // Fetch all bills for history
  useEffect(() => {
    const fetchBills = async () => {
      if (activePage !== "history") return;
      
      setLoading(true);
      try {
        const username = session?.user?.username;
        if (!username) return;

        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_id", username)
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
  }, [activePage, session]);

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
    setIsSubmitting(true);

    try {
      const billValue = parseFloat(formData.po_value);

      // Validation
      if (!formData.employee_id || !formData.employee_name) {
        alert("Employee ID and Name are required.");
        return;
      }

      if (isNaN(billValue) || billValue <= 0) {
        alert("Enter a valid bill amount.");
        return;
      }

      // Check if employee exists
      const { data: employeeCheck, error: empError } = await supabase
        .from("employees")
        .select("username")
        .eq("username", formData.employee_id)
        .single();

      if (empError || !employeeCheck) {
        alert("Employee ID not found in system. Please check the Employee ID.");
        return;
      }

      // Check PDA balance
      const { data: balanceData, error: balanceErr } = await supabase
        .from("pda_balances")
        .select("balance")
        .eq("employee_id", formData.employee_id)
        .single();

      if (balanceErr || !balanceData) {
        alert("No PDA balance found for this Employee ID.");
        return;
      }

      const currentBalance = parseFloat(balanceData.balance);
      if (currentBalance < billValue) {
        alert(`Insufficient PDA balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${billValue.toFixed(2)}`);
        return;
      }

      // Determine workflow based on bill amount
      let category = formData.item_category;
      let status = "User";
      let snp: "Pending" | null = null;
      let audit: "Pending" | null = null;
      let finance_admin: "Pending" | null = null;

      if (billValue > 50000) {
        // Bills > 50k go to SNP first
        if (category === "Minor") {
          alert("Bills greater than ₹50,000 cannot be categorized as Minor.");
          return;
        }
        status = "Student Purchase";
        snp = "Pending";
        audit = null;
        finance_admin = null;
      } else {
        // Bills <= 50k go directly to Audit
        category = "Minor";
        status = "Audit";
        snp = null;
        audit = "Pending";
        finance_admin = null;
      }

      // Prepare normalized data
      const normalizedData: any = {
        employee_id: formData.employee_id,
        employee_name: formData.employee_name,
        po_value: billValue,
        qty: formData.qty ? parseInt(formData.qty.toString()) : null,
        qty_issued: formData.qty_issued ? parseInt(formData.qty_issued.toString()) : null,
        item_category: category,
        status,
        snp,
        audit,
        finance_admin,
        // Reset all remarks to null for new submission
        remarks: null,
        remarks1: null,
        remarks2: null,
        remarks3: null,
        remarks4: null,
      };

      // Normalize optional text fields (empty strings to null)
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
      ];

      optionalFields.forEach((field) => {
        normalizedData[field] = formData[field] && formData[field].trim() ? formData[field].trim() : null;
      });

      // Deduct PDA balance first
      const { error: updateErr } = await supabase
        .from("pda_balances")
        .update({ 
          balance: currentBalance - billValue, 
          updated_at: new Date().toISOString() 
        })
        .eq("employee_id", formData.employee_id);

      if (updateErr) {
        console.error("Error updating PDA balance:", updateErr.message);
        alert("Error updating PDA balance.");
        return;
      }

      // Insert bill
      const { error: insertErr } = await supabase
        .from("bills")
        .insert([normalizedData]);

      if (insertErr) {
        // Rollback balance if bill insertion fails
        await supabase
          .from("pda_balances")
          .update({ 
            balance: currentBalance, 
            updated_at: new Date().toISOString() 
          })
          .eq("employee_id", formData.employee_id);

        console.error("Failed to submit bill:", insertErr.message);
        alert(`Failed to submit bill: ${insertErr.message}`);
        return;
      }

      // Success
      alert(`Bill submitted successfully! ${billValue > 50000 ? 'Sent to Student Purchase Department for review.' : 'Sent to Audit Department for review.'}`);
      
      // Reset form
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
      });
      setBalance(null);
      
      // Switch to history page to see the submitted bill
      setActivePage("history");

    } catch (err: any) {
      console.error("Unexpected error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBillStatusDisplay = (bill: Bill) => {
    if (bill.status === "Accepted") {
      return { label: "Fully Approved", color: "text-green-600 bg-green-100" };
    } else if (bill.snp === "Reject" || bill.audit === "Reject" || bill.finance_admin === "Reject") {
      return { label: "Rejected", color: "text-red-600 bg-red-100" };
    } else if (bill.snp === "Hold" || bill.audit === "Hold" || bill.finance_admin === "Hold") {
      return { label: "On Hold", color: "text-orange-600 bg-orange-100" };
    } else if (bill.status === "Student Purchase" && bill.snp === "Pending") {
      return { label: "Pending at SNP", color: "text-blue-600 bg-blue-100" };
    } else if (bill.status === "Audit" && bill.audit === "Pending") {
      return { label: "Pending at Audit", color: "text-blue-600 bg-blue-100" };
    } else if (bill.status === "Finance Admin" && bill.finance_admin === "Pending") {
      return { label: "Pending at Finance Admin", color: "text-blue-600 bg-blue-100" };
    } else {
      return { label: "Processing", color: "text-gray-600 bg-gray-100" };
    }
  };

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
                    (activePage === "upload" && link.label === "Upload Bill") ||
                    (activePage === "history" && link.label === "Bills History")
                      ? "bg-gray-200 font-medium"
                      : "hover:bg-gray-100"
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
          <div className="w-full max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl font-semibold mb-2">Submit New Bill</h1>
              <p className="text-gray-600 text-sm">
                Bills over ₹50,000 will be sent to Student Purchase Department first, 
                others go directly to Audit Department.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-lg border p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Employee ID - Required */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your employee ID"
                    required
                  />
                </div>

                {/* Employee Name - Required */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* PO Details */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">PO Details</label>
                  <input
                    type="text"
                    value={formData.po_details}
                    onChange={(e) => setFormData({ ...formData, po_details: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Purchase Order Number & Date"
                  />
                </div>

                {/* PO Value - Required */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">
                    Bill Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.po_value}
                    onChange={(e) => setFormData({ ...formData, po_value: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bill amount"
                    required
                  />
                </div>

                {/* Supplier Name */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name of the supplier"
                  />
                </div>

                {/* Item Category */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Item Category</label>
                  <select
                    value={formData.item_category}
                    onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Bills over ₹50,000 cannot be Minor category
                  </p>
                </div>

                {/* Supplier Address */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Supplier Address</label>
                  <textarea
                    rows={2}
                    value={formData.supplier_address}
                    onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Complete address of the supplier"
                  />
                </div>

                {/* Item Description */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Item Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.item_description}
                    onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed description of items with specifications"
                    required
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of items"
                  />
                </div>

                {/* Bill Details */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Bill Details</label>
                  <input
                    type="text"
                    value={formData.bill_details}
                    onChange={(e) => setFormData({ ...formData, bill_details: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bill number, date, value"
                  />
                </div>

                {/* Indenter Name */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Indenter Name</label>
                  <input
                    type="text"
                    value={formData.indenter_name}
                    onChange={(e) => setFormData({ ...formData, indenter_name: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Person requesting the items"
                  />
                </div>

                {/* Quantity Issued */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Quantity Issued</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qty_issued}
                    onChange={(e) => setFormData({ ...formData, qty_issued: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quantity actually issued"
                  />
                </div>

                {/* Source of Fund */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Source of Fund</label>
                  <input
                    type="text"
                    value={formData.source_of_fund}
                    onChange={(e) => setFormData({ ...formData, source_of_fund: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Budget head or fund source"
                  />
                </div>

                {/* Stock Entry */}
                <div className="md:col-span-1">
                  <label className="block text-gray-700 font-medium mb-2">Stock Entry</label>
                  <input
                    type="text"
                    value={formData.stock_entry}
                    onChange={(e) => setFormData({ ...formData, stock_entry: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Stock entry details"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Location where items will be stored/used"
                  />
                </div>
              </div>

              {/* PDA Balance Display */}
              {balance !== null && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    Current PDA Balance: ₹{balance.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-8">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Bill"
                  )}
                </motion.button>
              </div>
            </motion.form>
          </div>
        )}

        {activePage === "history" && (
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-semibold">Your Bills History</h2>
              <p className="text-gray-600 text-sm mt-1">Track the status of your submitted bills</p>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading bills...</span>
              </div>
            ) : bills.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white rounded-lg shadow border"
              >
                <IconHistory className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No bills submitted yet</p>
                <p className="text-gray-400 text-sm">Your bill history will appear here once you submit bills</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {bills.map((bill, index) => {
                  const statusDisplay = getBillStatusDisplay(bill);
                  return (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {bill.item_description || "No description"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Bill ID: {bill.id} | Employee: {bill.employee_name}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="font-medium">₹{bill.po_value?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="font-medium">{bill.qty || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="font-medium">{bill.item_category || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="font-medium">
                            {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Workflow Progress */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Progress:</p>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Submitted</span>
                          {bill.snp !== null && (
                            <span className={`px-2 py-1 rounded ${
                              bill.snp === "Approved" ? "bg-green-100 text-green-800" :
                              bill.snp === "Reject" ? "bg-red-100 text-red-800" :
                              bill.snp === "Hold" ? "bg-orange-100 text-orange-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              SNP: {bill.snp}
                            </span>
                          )}
                          {bill.audit !== null && (
                            <span className={`px-2 py-1 rounded ${
                              bill.audit === "Approved" ? "bg-green-100 text-green-800" :
                              bill.audit === "Reject" ? "bg-red-100 text-red-800" :
                              bill.audit === "Hold" ? "bg-orange-100 text-orange-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              Audit: {bill.audit}
                            </span>
                          )}
                          {bill.finance_admin && (
                            <span className={`px-2 py-1 rounded ${
                              bill.finance_admin === "Approved" ? "bg-green-100 text-green-800" :
                              bill.finance_admin === "Reject" ? "bg-red-100 text-red-800" :
                              bill.finance_admin === "Hold" ? "bg-orange-100 text-orange-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              Finance: {bill.finance_admin}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remarks */}
                      {(bill.remarks1 || bill.remarks2 || bill.remarks || bill.remarks3 || bill.remarks4) && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Department Remarks:</p>
                          <div className="space-y-2">
                            {bill.remarks1 && (
                              <div className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-800">SNP:</span> {bill.remarks1}
                              </div>
                            )}
                            {bill.remarks2 && (
                              <div className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-800">Audit:</span> {bill.remarks2}
                              </div>
                            )}
                            {bill.remarks && (
                              <div className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-800">Finance Admin:</span> {bill.remarks}
                              </div>
                            )}
                            {bill.remarks3 && (
                              <div className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-800">Other:</span> {bill.remarks3}
                              </div>
                            )}
                            {bill.remarks4 && (
                              <div className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-800">Additional:</span> {bill.remarks4}
                              </div>
                            )}
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