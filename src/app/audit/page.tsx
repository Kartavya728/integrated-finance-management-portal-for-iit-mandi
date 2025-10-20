"use client";
import { sendBillRemarkNotification } from "@/helpers/emailService";
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
  IconEye,
  IconClock,
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconCurrencyRupee,
  IconMapPin,
  IconCategory,
} from "@tabler/icons-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/* ---------- Interfaces ---------- */
interface Bill {
  id: string;
  employee_id: string;
  employee_name: string;
  po_details: string;
  po_value: number;
  supplier_name: string;
  supplier_address: string;
  item_category: string;
  item_description: string;
  qty: number;
  bill_details: string;
  indenter_name: string;
  qty_issued: number;
  source_of_fund: string;
  stock_entry: string;
  location: string;
  remarks: string;    // Finance Admin remark
  remarks1: string;   // SNP remark
  remarks2: string;   // Audit remark (this department)
  remarks3: string;   // Additional remark
  remarks4: string;   // Additional remark
  created_at: string;
  status: string;
  snp: string;
  audit: string;
  finance_admin: string;
}

export default function AuditDashboard() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Approved" | "Hold" | "Reject" | "Pending"
  >("Pending");
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBillDetails, setSelectedBillDetails] = useState<Bill | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [amountFilter, setAmountFilter] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch bills - only show bills where audit is not NULL and status is Audit
  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .eq("status", "Audit") // Only bills at Audit stage
          .not("audit", "is", null) // Exclude bills where audit is NULL
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBills(data || []);
        setFilteredBills(data || []);
      } catch (err) {
        console.error("Error fetching bills:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // Apply filters whenever search criteria change
  useEffect(() => {
    let filtered = bills;

    // Status filter
    if (activeFilter !== "All") {
      filtered = filtered.filter((b) => b.audit === activeFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => 
        b.po_details?.toLowerCase().includes(query) ||
        b.supplier_name?.toLowerCase().includes(query) ||
        b.employee_name?.toLowerCase().includes(query) ||
        b.employee_id?.toLowerCase().includes(query) ||
        b.item_description?.toLowerCase().includes(query) ||
        b.bill_details?.toLowerCase().includes(query) ||
        b.indenter_name?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "All") {
      filtered = filtered.filter((b) => b.item_category === categoryFilter);
    }

    // Amount filter
    if (amountFilter.min || amountFilter.max) {
      const min = amountFilter.min ? parseFloat(amountFilter.min) : 0;
      const max = amountFilter.max ? parseFloat(amountFilter.max) : Infinity;
      filtered = filtered.filter((b) => b.po_value >= min && b.po_value <= max);
    }

    // Date filter
    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter((b) => {
        if (!b.created_at) return false;
        const billDate = new Date(b.created_at);
        const start = dateFilter.start ? new Date(dateFilter.start) : new Date("1900-01-01");
        const end = dateFilter.end ? new Date(dateFilter.end) : new Date("2100-12-31");
        return billDate >= start && billDate <= end;
      });
    }

    // Location filter
    if (locationFilter.trim()) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter((b) => 
        b.location?.toLowerCase().includes(location) ||
        b.supplier_address?.toLowerCase().includes(location)
      );
    }

    setFilteredBills(filtered);
  }, [bills, activeFilter, searchQuery, categoryFilter, amountFilter, dateFilter, locationFilter]);

  // approve handler - moves to Finance Admin
  const handleApprove = async (bill: Bill) => {
    try {
      const { error } = await (supabase as any)
        .from("bills")
        .update({
          status: "Finance Admin",
          finance_admin: "Pending",
          audit: "Approved",
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id
            ? { ...b, status: "Finance Admin", finance_admin: "Pending", audit: "Approved" }
            : b
        )
      );
      
      alert("Bill approved and sent to Finance Admin!");
    } catch (err) {
      console.error("Error approving bill:", err);
      alert("Error approving bill");
    }
  };

  // reject handler - sets Audit status to Reject with remark and sends email
  const handleReject = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please provide a remark before rejecting.");
      return;
    }

    try {
      const remarkWithUser = `${remarks[bill.id]} (By: ${session?.user?.name || 'Audit'} at ${new Date().toLocaleString()})`;
      const { error } = await (supabase as any)
        .from("bills")
        .update({
          audit: "Reject",
          remarks2: remarkWithUser, // Audit department uses remarks2
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id 
            ? { ...b, audit: "Reject", remarks2: remarkWithUser } 
            : b
        )
      );

      // Log before sending email
      console.log('Audit email notification called for bill:', bill.id);
      // Send email notification
      try {
        if (typeof sendBillRemarkNotification === 'function') {
          await sendBillRemarkNotification({
            billId: bill.id,
            department: 'Audit',
            remark: remarks[bill.id],
            action: 'Reject',
            timestamp: new Date().toLocaleString()
          });
        }
        alert("Bill rejected! Email notification sent to employee.");
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
        alert("Bill rejected! However, email notification failed to send.");
      }
    } catch (err) {
      console.error("Error rejecting bill:", err);
      alert("Error rejecting bill");
    }
  };

  // hold handler - sets Audit status to Hold with remark and sends email
  const handleHold = async (bill: Bill) => {
    if (!remarks[bill.id] || remarks[bill.id].trim() === "") {
      alert("Please enter a remark before putting the bill on Hold.");
      return;
    }

    try {
      const remarkWithUser = `${remarks[bill.id]} (By: ${session?.user?.name || 'Audit'} at ${new Date().toLocaleString()})`;
      const { error } = await (supabase as any)
        .from("bills")
        .update({
          audit: "Hold",
          remarks2: remarkWithUser, // Audit department uses remarks2
        })
        .eq("id", bill.id);

      if (error) throw error;

      setBills((prev) =>
        prev.map((b) =>
          b.id === bill.id 
            ? { ...b, audit: "Hold", remarks2: remarkWithUser } 
            : b
        )
      );

      // Log before sending email
      console.log('Audit email notification called for bill:', bill.id);
      // Send email notification
      try {
        if (typeof sendBillRemarkNotification === 'function') {
          await sendBillRemarkNotification({
            billId: bill.id,
            department: 'Audit',
            remark: remarks[bill.id],
            action: 'Hold',
            timestamp: new Date().toLocaleString()
          });
        }
        alert("Bill put on hold! Email notification sent to employee.");
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
        alert("Bill put on hold! However, email notification failed to send.");
      }
    } catch (err) {
      console.error("Error holding bill:", err);
      alert("Error holding bill");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setAmountFilter({ min: "", max: "" });
    setDateFilter({ start: "", end: "" });
    setLocationFilter("");
  };

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
        supplierAddress: bill.supplier_address || "N/A",
        itemDescription: bill.item_description || "N/A",
        itemCategory: bill.item_category || "N/A",
        quantity: bill.qty || 0,
        totalValue: bill.po_value || 0,
        billDetails: bill.bill_details || "N/A",
        indenterName: bill.indenter_name || "N/A",
        qtyIssued: bill.qty_issued || 0,
        sourceOfFund: bill.source_of_fund || "N/A",
        stockEntry: bill.stock_entry || "N/A",
        location: bill.location || "N/A",
      },
      workflowStatus: {
        overall: bill.status,
        snpStatus: bill.snp || "NULL",
        auditStatus: bill.audit || "Pending",
        financeAdminStatus: bill.finance_admin || "NULL",
      },
      departmentRemarks: {
        snp: bill.remarks1 || "No remark from SNP",
        audit: bill.remarks2 || "No remark yet",
        financeAdmin: bill.remarks3 || "Not reached Finance Admin yet",
        other: bill.remarks4 || "No additional remark",
      }
    };
  };

  const pendingCount = bills.filter((b) => b.audit === "Pending").length;
  const approvedCount = bills.filter((b) => b.audit === "Approved").length;
  const holdCount = bills.filter((b) => b.audit === "Hold").length;
  const rejectCount = bills.filter((b) => b.audit === "Reject").length;

  const links = [
    {
      label: "All Bills",
      icon: <IconListDetails className="h-5 w-5 shrink-0 text-blue-600" />,
      onClick: () => setActiveFilter("All"),
    },
    {
      label: "Pending Bills",
      icon: <IconClock className="h-5 w-5 shrink-0 text-orange-600" />,
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
                    "flex items-center gap-2 px-3 py-2 rounded text-left w-full transition-colors",
                    activeFilter === link.label.replace(" Bills", "") 
                      ? "bg-blue-100 font-medium text-blue-900" 
                      : "hover:bg-gray-100"
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
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading Audit bills...</span>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Audit Department
              </h1>
              <p className="text-gray-600 font-medium">
                Bills requiring Audit review: {pendingCount} pending
              </p>
            </motion.div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bills by PO details, supplier, employee, item description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  <IconFilter className="h-5 w-5" />
                  Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t"
                  >
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <IconCategory className="inline h-4 w-4 mr-1" />
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Categories</option>
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Consumables">Consumables</option>
                      </select>
                    </div>

                    {/* Amount Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <IconCurrencyRupee className="inline h-4 w-4 mr-1" />
                        Amount Range
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={amountFilter.min}
                          onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={amountFilter.max}
                          onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <IconCalendar className="inline h-4 w-4 mr-1" />
                        Date Range
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFilter.start}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="date"
                          value={dateFilter.end}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <IconMapPin className="inline h-4 w-4 mr-1" />
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="Search by location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results count */}
              <div className="text-sm text-gray-600">
                Showing {filteredBills.length} of {bills.length} bills
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                  </div>
                  <IconClock className="h-8 w-8 text-orange-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                  </div>
                  <IconCheck className="h-8 w-8 text-green-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hold</p>
                    <p className="text-2xl font-bold text-yellow-600">{holdCount}</p>
                  </div>
                  <IconClockPause className="h-8 w-8 text-yellow-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{rejectCount}</p>
                  </div>
                  <IconX className="h-8 w-8 text-red-500" />
                </div>
              </motion.div>
            </div>

            {/* Bills List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  {activeFilter} Bills - Audit Department
                </h2>
              </div>

              {filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <IconAlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No {activeFilter.toLowerCase()} bills found</p>
                  {(searchQuery || categoryFilter !== "All" || amountFilter.min || amountFilter.max || dateFilter.start || dateFilter.end || locationFilter) && (
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredBills.map((bill, index) => {
                    const isExpanded = expandedBillId === bill.id;
                    const canTakeAction = bill.audit === "Pending" || bill.audit === "Hold";

                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 hover:bg-gray-50 transition-colors",
                          bill.audit === "Approved" && "bg-green-50",
                          bill.audit === "Reject" && "bg-red-50",
                          bill.audit === "Hold" && "bg-yellow-50"
                        )}
                      >
                        {/* Summary Row */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {bill.item_description || "No description"}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Employee:</span> {bill.employee_name}
                              </div>
                              <div>
                                <span className="font-medium">Amount:</span> ₹{bill.po_value?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Supplier:</span> {bill.supplier_name || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {bill.item_category || "N/A"}
                              </div>
                            </div>
                            {bill.location && (
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Location:</span> {bill.location}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedBillDetails(bill);
                                setShowDetailModal(true);
                              }}
                              className="p-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="View Details"
                            >
                              <IconEye size={16} />
                            </button>
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              bill.audit === "Approved" ? "bg-green-100 text-green-800" :
                              bill.audit === "Reject" ? "bg-red-100 text-red-800" :
                              bill.audit === "Hold" ? "bg-yellow-100 text-yellow-800" :
                              "bg-orange-100 text-orange-800"
                            }`}>
                              {bill.audit || "Pending"}
                            </span>
                            
                            <button
                              onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                              className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              {isExpanded ? "Hide" : "View"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 space-y-4 border-t pt-4"
                            >
                              {/* Additional Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="font-medium text-gray-700 mb-1">Purchase Details</p>
                                  <p><span className="font-medium">PO:</span> {bill.po_details || "N/A"}</p>
                                  <p><span className="font-medium">Quantity:</span> {bill.qty || 0}</p>
                                  <p><span className="font-medium">Quantity Issued:</span> {bill.qty_issued || 0}</p>
                                  <p><span className="font-medium">Source of Fund:</span> {bill.source_of_fund || "N/A"}</p>
                                  <p><span className="font-medium">Stock Entry:</span> {bill.stock_entry || "N/A"}</p>
                                  <p><span className="font-medium">Submitted:</span> {
                                    bill.created_at ? new Date(bill.created_at).toLocaleDateString() : "N/A"
                                  }</p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="bg-blue-50 p-3 rounded">
                                    <p className="font-medium text-blue-800 mb-1">Additional Info</p>
                                    <p><span className="font-medium">Bill Details:</span> {bill.bill_details || "N/A"}</p>
                                    <p><span className="font-medium">Indenter:</span> {bill.indenter_name || "N/A"}</p>
                                    <p><span className="font-medium">Supplier Address:</span> {bill.supplier_address || "N/A"}</p>
                                  </div>
                                  
                                  {bill.remarks1 && (
                                    <div className="bg-purple-50 p-3 rounded">
                                      <p className="font-medium text-purple-800 mb-1">SNP Remark</p>
                                      <p className="text-purple-700 text-sm">{bill.remarks1}</p>
                                    </div>
                                  )}
                                  
                                  {bill.remarks2 && (
                                    <div className="bg-green-50 p-3 rounded">
                                      <p className="font-medium text-green-800 mb-1">Your Audit Remark</p>
                                      <p className="text-green-700 text-sm">{bill.remarks2}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Remark Input & Actions */}
                              {canTakeAction && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Add Audit Remark {bill.audit === "Hold" ? "(Update)" : "(Required for Hold/Reject)"}
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="Enter your audit remark here..."
                                      value={remarks[bill.id] || ""}
                                      onChange={(e) =>
                                        setRemarks((prev) => ({
                                          ...prev,
                                          [bill.id]: e.target.value,
                                        }))
                                      }
                                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>

                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleApprove(bill)}
                                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                    >
                                      <IconCheck size={16} />
                                      Approve & Send to Finance Admin
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
                              )}

                              {/* Show actions result for approved/rejected bills */}
                              {!canTakeAction && (
                                <div className={`p-3 rounded-lg ${
                                  bill.audit === "Approved" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  <p className="font-medium">
                                    {bill.audit === "Approved" 
                                      ? "✅ Bill approved and sent to Finance Admin Department" 
                                      : "❌ Bill rejected by Audit Department"}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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
                <h3 className="text-xl font-semibold">Bill Details - Audit Review</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBillDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                        <h4 className="font-semibold mb-3 text-gray-800">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="font-medium">Bill ID:</span> {details.basicInfo.id}</div>
                          <div><span className="font-medium">Employee ID:</span> {details.basicInfo.employeeId}</div>
                          <div><span className="font-medium">Employee Name:</span> {details.basicInfo.employeeName}</div>
                          <div><span className="font-medium">Submitted:</span> {details.basicInfo.submittedAt}</div>
                        </div>
                      </div>

                      {/* Purchase Details */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-gray-800">Purchase Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="font-medium">PO Details:</span> {details.purchaseDetails.poDetails}</div>
                          <div><span className="font-medium">Supplier:</span> {details.purchaseDetails.supplierName}</div>
                          <div><span className="font-medium">Supplier Address:</span> {details.purchaseDetails.supplierAddress}</div>
                          <div><span className="font-medium">Category:</span> {details.purchaseDetails.itemCategory}</div>
                          <div><span className="font-medium">Quantity:</span> {details.purchaseDetails.quantity}</div>
                          <div><span className="font-medium">Qty Issued:</span> {details.purchaseDetails.qtyIssued}</div>
                          <div><span className="font-medium">Source of Fund:</span> {details.purchaseDetails.sourceOfFund}</div>
                          <div><span className="font-medium">Stock Entry:</span> {details.purchaseDetails.stockEntry}</div>
                          <div><span className="font-medium">Location:</span> {details.purchaseDetails.location}</div>
                          <div><span className="font-medium">Indenter:</span> {details.purchaseDetails.indenterName}</div>
                          <div className="md:col-span-2">
                            <span className="font-medium">Description:</span> {details.purchaseDetails.itemDescription}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium">Bill Details:</span> {details.purchaseDetails.billDetails}
                          </div>
                          <div><span className="font-medium">Total Value:</span> ₹{details.purchaseDetails.totalValue.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Workflow Status */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-gray-800">Workflow Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="font-medium">Current Stage:</span> {details.workflowStatus.overall}</div>
                          <div><span className="font-medium">SNP Status:</span> {details.workflowStatus.snpStatus}</div>
                          <div><span className="font-medium">Audit Status:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              details.workflowStatus.auditStatus === "Approved" ? "bg-green-100 text-green-800" :
                              details.workflowStatus.auditStatus === "Reject" ? "bg-red-100 text-red-800" :
                              details.workflowStatus.auditStatus === "Hold" ? "bg-yellow-100 text-yellow-800" :
                              "bg-orange-100 text-orange-800"
                            }`}>
                              {details.workflowStatus.auditStatus}
                            </span>
                          </div>
                          <div><span className="font-medium">Finance Status:</span> {details.workflowStatus.financeAdminStatus}</div>
                        </div>
                      </div>

                      {/* Department Remarks */}
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-gray-800">Department Remarks</h4>
                        <div className="space-y-3">
                          {details.departmentRemarks.snp !== "No remark from SNP" && (
                            <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                              <div className="font-medium text-purple-800">SNP Department:</div>
                              <div className="text-gray-700 mt-1">{details.departmentRemarks.snp}</div>
                            </div>
                          )}
                          {details.departmentRemarks.audit !== "No remark yet" && (
                            <div className="bg-white p-3 rounded border-l-4 border-green-500">
                              <div className="font-medium text-green-800">Audit Department (Your Remark):</div>
                              <div className="text-gray-700 mt-1">{details.departmentRemarks.audit}</div>
                            </div>
                          )}
                          {details.departmentRemarks.financeAdmin !== "Not reached Finance Admin yet" && (
                            <div className="bg-white p-3 rounded border-l-4 border-gray-300">
                              <div className="font-medium text-gray-600">Finance Admin:</div>
                              <div className="text-gray-500 mt-1 italic">{details.departmentRemarks.financeAdmin}</div>
                            </div>
                          )}
                          {details.departmentRemarks.other !== "No additional remark" && (
                            <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                              <div className="font-medium text-blue-800">Other:</div>
                              <div className="text-gray-700 mt-1">{details.departmentRemarks.other}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Note */}
                      {selectedBillDetails.audit === "Pending" && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <IconAlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-800">Audit Review Required</p>
                              <p className="text-sm text-orange-700 mt-1">
                                This bill requires your audit review. Please approve to send to Finance Admin, 
                                hold for more information, or reject if audit requirements are not met.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
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
      Audit Department
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
