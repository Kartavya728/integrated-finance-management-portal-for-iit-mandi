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
  IconCheck,
  IconClock,
  IconExclamationMark,
  IconBan,
  IconFileText,
  IconAlertCircle,
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
  employee_name: string;
  item_description?: string;
  item_category?: string;
  qty?: number;
  remarks?: string;   // Finance Admin remark
  remarks1?: string;  // SNP remark
  remarks2?: string;  // Audit remark
  remarks3?: string;  // Other remark
  remarks4?: string;  // Additional remark
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

interface BillStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  onHold: number;
}

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
  const [billStats, setBillStats] = useState<BillStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    onHold: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const username = session?.user?.username;
        if (!username) return;

        // Fetch employee data
        const { data: employeeData } = await supabase
          .from("employees")
          .select("*")
          .eq("username", username)
          .single();
        if (employeeData) setEmployee(employeeData);

        // Fetch PDA balance
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

        // Fetch bills
        const { data: billsData } = await supabase
          .from("bills")
          .select("*")
          .eq("employee_id", username)
          .or(
            [
              `employee_id.eq.${username}`,
              `employee_id.like.%${username}%`,
              `employee_id.like.%${username}`,
              `employee_id.like.${username}%`
            ].join(",")
          )
          .order("created_at", { ascending: false });

        if (billsData) {
          setBills(billsData);
          
          // Calculate stats
          const stats: BillStats = {
            total: billsData.length,
            pending: 0,
            approved: 0,
            rejected: 0,
            onHold: 0,
          };

          billsData.forEach((bill: any) => {
            if (bill.status === "Accepted") {
              stats.approved++;
            } else if (
              bill.audit === "Reject" ||
              bill.finance_admin === "Reject" ||
              bill.snp === "Reject"
            ) {
              stats.rejected++;
            } else if (
              bill.audit === "Hold" ||
              bill.finance_admin === "Hold" ||
              bill.snp === "Hold"
            ) {
              stats.onHold++;
            } else {
              stats.pending++;
            }
          });

          setBillStats(stats);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const getBillStatus = (bill: Bill) => {
    let statusLabel = "Unknown";
    let statusType = "unknown";

    if (bill.status === "Accepted") {
      statusLabel = "Approved (All Stages)";
      statusType = "approved";
    } else if (
      bill.audit === "Reject" ||
      bill.finance_admin === "Reject" ||
      bill.snp === "Reject"
    ) {
      statusLabel = "Rejected";
      statusType = "rejected";
      
      // Find which department rejected
      if (bill.snp === "Reject") statusLabel += " by SNP";
      else if (bill.audit === "Reject") statusLabel += " by Audit";
      else if (bill.finance_admin === "Reject") statusLabel += " by Finance Admin";
      
    } else if (
      bill.audit === "Hold" ||
      bill.finance_admin === "Hold" ||
      bill.snp === "Hold"
    ) {
      statusLabel = "On Hold";
      statusType = "hold";
      
      // Find which department put on hold
      if (bill.snp === "Hold") statusLabel += " by SNP";
      else if (bill.audit === "Hold") statusLabel += " by Audit";
      else if (bill.finance_admin === "Hold") statusLabel += " by Finance Admin";
      
    } else {
      statusType = "pending";
      // New workflow mapping: SNP only for Major/Minor; Consumables skip SNP
      if (bill.status === "Student Purchase" && bill.snp === "Pending") {
        statusLabel = "Pending at SNP";
      } else if (bill.status === "Audit" && bill.audit === "Pending") {
        statusLabel = "Pending at Audit";
      } else if (bill.status === "Finance Admin" && bill.finance_admin === "Pending") {
        statusLabel = "Pending at Finance Admin";
      } else if (bill.status === "User") {
        statusLabel = "Submitted - Processing Started";
      }
    }

    return { statusLabel, statusType };
  };

  const getBillRemarks = (bill: Bill) => {
    const remarks: { department: string; remark: string }[] = [];
    
    if (bill.remarks1) remarks.push({ department: "SNP", remark: bill.remarks1 });
    if (bill.remarks2) remarks.push({ department: "Audit", remark: bill.remarks2 });
    if (bill.remarks) remarks.push({ department: "Finance Admin", remark: bill.remarks });
    if (bill.remarks3) remarks.push({ department: "Other", remark: bill.remarks3 });
    if (bill.remarks4) remarks.push({ department: "Additional", remark: bill.remarks4 });
    
    return remarks;
  };

  const formatBillDetails = (bill: Bill) => {
    const { statusLabel, statusType } = getBillStatus(bill);
    const remarks = getBillRemarks(bill);
    
    return {
      basicInfo: {
        id: bill.id,
        employeeId: bill.employee_id,
        employeeName: bill.employee_name,
        submittedAt: bill.created_at ? new Date(bill.created_at).toLocaleString() : "N/A",
      },
      purchaseDetails: {
        poDetails: bill.po_details,
        supplierName: bill.supplier_name,
        itemDescription: bill.item_description,
        itemCategory: bill.item_category,
        quantity: bill.qty,
        totalValue: bill.po_value,
      },
      currentStatus: {
        overall: bill.status,
        snpStatus: bill.snp || "NULL",
        auditStatus: bill.audit || "NULL",
        financeAdminStatus: bill.finance_admin || "NULL",
        displayStatus: statusLabel,
        statusType: statusType,
      },
      departmentRemarks: remarks,
      workflowProgress: {
        step1_Submission: "✅ Completed",
        step2_SNP:
          bill.snp == null && (bill.status === "Audit" || bill.status === "Finance Admin")
            ? "↷ Skipped"
            : bill.snp === "Approved"
            ? "✅ Approved"
            : bill.snp === "Reject"
            ? "❌ Rejected"
            : bill.snp === "Hold"
            ? "⏸️ On Hold"
            : bill.snp === "Pending"
            ? "🔄 In Progress"
            : "⏳ Pending",
        step3_Audit:
          bill.audit == null && bill.status === "Finance Admin"
            ? "↷ Skipped"
            : bill.audit === "Approved"
            ? "✅ Approved"
            : bill.audit === "Reject"
            ? "❌ Rejected"
            : bill.audit === "Hold"
            ? "⏸️ On Hold"
            : bill.audit === "Pending"
            ? "🔄 In Progress"
            : "⏳ Pending",
        step4_FinanceAdmin:
          bill.finance_admin === "Approved"
            ? "✅ Approved"
            : bill.finance_admin === "Reject"
            ? "❌ Rejected"
            : bill.finance_admin === "Hold"
            ? "⏸️ On Hold"
            : bill.finance_admin === "Pending"
            ? "🔄 In Progress"
            : "⏳ Pending",
        step5_FinalApproval: bill.status === "Accepted" ? "✅ Complete" : "⏳ Pending",
      }
    };
  };

  const links = [
    { 
      label: "Dashboard", 
      href: "/user", 
      icon: <IconWallet className="h-5 w-5 shrink-0 text-neutral-700" /> 
    },
  ];

  const StatCard = ({ title, value, icon, color, description }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-2.5 sm:p-3 md:p-4 shadow-sm hover:shadow transition-all border-2 ${color} bg-white`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{description}</p>
        </div>
        <div className="text-xl sm:text-2xl md:text-3xl opacity-60 flex-shrink-0">
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      {/* Sidebar - hidden on small screens */}
      <div className="hidden sm:block">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-6 md:gap-10">
            <div className="flex flex-1 flex-col overflow-y-auto">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-4 md:mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>

            {/* User info and logout */}
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
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left w-full text-xs md:text-sm"
              >
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
                <span>Logout</span>
              </button>
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto w-full">
        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-white border-b">
          <a href="#" className="flex items-center gap-2">
            <img src="/iit.png" alt="IIT Mandi" className="h-7 w-7 rounded-full" />
            <span className="font-semibold text-sm">IIT Mandi Finance</span>
          </a>
          <div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full">
          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm md:text-base">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Welcome Section */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
                  Welcome, {employee?.name || session?.user?.username}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 md:mt-2 break-words">
                  Integrated Finance Management Portal - IIT Mandi
                </p>
              </motion.div>

              {/* PDA Balance Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md text-sm sm:text-base w-full sm:w-auto"
                >
                  {showBalance ? "Hide Balance" : "Show Balance"}
                </button>
                <AnimatePresence>
                  {showBalance && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 sm:mt-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <p className="text-base sm:text-lg md:text-xl font-bold text-green-800 break-words">
                        Balance: ₹{balance.toLocaleString()}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
                  <StatCard
                    title="Total"
                    value={billStats.total}
                    icon={<IconFileText />}
                    color="border-blue-200"
                    description="Bills"
                  />
                  <StatCard
                    title="Pending"
                    value={billStats.pending}
                    icon={<IconClock />}
                    color="border-yellow-200"
                    description="Review"
                  />
                  <StatCard
                    title="Approved"
                    value={billStats.approved}
                    icon={<IconCheck />}
                    color="border-green-200"
                    description="Done"
                  />
                  <StatCard
                    title="Rejected"
                    value={billStats.rejected}
                    icon={<IconBan />}
                    color="border-red-200"
                    description="Failed"
                  />
              </div>

              {/* Bills Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-3 sm:p-4 md:p-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                    <IconReceipt2 className="text-blue-600 flex-shrink-0" />
                    <span className="truncate">Your Bills</span>
                  </h2>
                  
                  {bills.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 md:py-12">
                      <IconFileText className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-300 mx-auto mb-2 sm:mb-3 md:mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base md:text-lg">No bills submitted yet.</p>
                      <p className="text-gray-400 text-xs sm:text-sm">Your bills will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                      {bills.map((bill, index) => {
                        const { statusLabel, statusType } = getBillStatus(bill);
                        const remarks = getBillRemarks(bill);

                        const cardColors = {
                          approved: "border-green-500 bg-green-50",
                          rejected: "border-red-500 bg-red-50",
                          hold: "border-orange-500 bg-orange-50",
                          pending: "border-blue-500 bg-blue-50",
                          unknown: "border-gray-500 bg-gray-50",
                        };

                        const statusIcons = {
                          approved: <IconCheck className="text-green-600" />,
                          rejected: <IconBan className="text-red-600" />,
                          hold: <IconAlertCircle className="text-orange-600" />,
                          pending: <IconClock className="text-blue-600" />,
                          unknown: <IconExclamationMark className="text-gray-600" />,
                        };

                        return (
                          <motion.div
                            key={bill.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 shadow-sm hover:shadow transition-all duration-300 ${
                              cardColors[statusType as keyof typeof cardColors]
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 line-clamp-2 break-words">
                                  {bill.item_description || "No description"}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-1 break-words">
                                  {bill.po_details || "N/A"} | {bill.supplier_name || "N/A"}
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0 text-lg sm:text-xl">
                                {statusIcons[statusType as keyof typeof statusIcons]}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-1 sm:space-y-2 mb-3">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-semibold">₹{bill.po_value?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Qty:</span>
                                <span className="font-semibold">{bill.qty || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-semibold truncate">{bill.item_category || "N/A"}</span>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-0.5">Status:</p>
                              <p className={`text-xs font-bold ${
                                statusType === "approved" ? "text-green-700" :
                                statusType === "rejected" ? "text-red-700" :
                                statusType === "hold" ? "text-orange-700" :
                                statusType === "pending" ? "text-blue-700" : "text-gray-700"
                              }`}>
                                {statusLabel}
                              </p>
                            </div>

                            {/* Remarks */}
                            {remarks.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 mb-1">Remarks:</p>
                                <div className="space-y-0.5">
                                  {remarks.map((remark, idx) => (
                                    <div key={idx} className="text-xs bg-white bg-opacity-50 rounded p-1 border">
                                      <span className="font-semibold text-gray-700">{remark.department}:</span>
                                      <span className="text-gray-700 ml-1 break-words">{remark.remark}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Submission Date */}
                            <div className="mb-3">
                              <p className="text-xs text-gray-500">
                                {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : "N/A"}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => setSelectedBill(bill)}
                                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-700 hover:text-gray-900 rounded border border-gray-300 hover:border-gray-400 transition-all text-xs sm:text-sm font-medium"
                              >
                                <IconEye size={14} className="sm:w-4 sm:h-4" />
                                View
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Detailed Bill Modal */}
      <AnimatePresence>
        {selectedBill && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl w-full max-w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Bill Details</h2>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="space-y-6">
                  {(() => {
                    const details = formatBillDetails(selectedBill);
                    return (
                      <>
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800">Basic Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div><span className="font-medium">Bill ID:</span> {details.basicInfo.id}</div>
                            <div><span className="font-medium">Employee:</span> {details.basicInfo.employeeName}</div>
                            <div><span className="font-medium">Employee ID:</span> {details.basicInfo.employeeId}</div>
                            <div><span className="font-medium">Submitted:</span> {details.basicInfo.submittedAt}</div>
                          </div>
                        </div>

                        {/* Purchase Details */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800">Purchase Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div><span className="font-medium">PO Details:</span> {details.purchaseDetails.poDetails || "N/A"}</div>
                            <div><span className="font-medium">Supplier:</span> {details.purchaseDetails.supplierName || "N/A"}</div>
                            <div><span className="font-medium">Category:</span> {details.purchaseDetails.itemCategory || "N/A"}</div>
                            <div><span className="font-medium">Quantity:</span> {details.purchaseDetails.quantity || 0}</div>
                            <div><span className="font-medium">Total Value:</span> ₹{details.purchaseDetails.totalValue?.toLocaleString() || "0"}</div>
                            <div className="md:col-span-2">
                              <span className="font-medium">Description:</span> {details.purchaseDetails.itemDescription || "N/A"}
                            </div>
                          </div>
                        </div>

                        {/* Workflow Progress */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800">Workflow Progress</h3>
                          <div className="space-y-2 text-sm">
                            {Object.entries(details.workflowProgress).map(([step, status]) => (
                              <div key={step} className="flex justify-between items-center py-1">
                                <span className="font-medium">{step.replace(/_/g, ' ').replace(/step\d+/i, '').trim()}:</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  status.includes('✅') ? 'bg-green-100 text-green-800' :
                                  status.includes('❌') ? 'bg-red-100 text-red-800' :
                                  status.includes('⏸️') ? 'bg-orange-100 text-orange-800' :
                                  status.includes('🔄') ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Department Remarks */}
                        {details.departmentRemarks.length > 0 && (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">Department Remarks</h3>
                            <div className="space-y-3">
                              {details.departmentRemarks.map((remark, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border-l-4 border-yellow-400">
                                  <div className="font-semibold text-gray-800 mb-1">
                                    Remark by {remark.department}:
                                  </div>
                                  <div className="text-gray-700 text-sm">
                                    {remark.remark}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Current Status */}
                        <div className={`rounded-lg p-4 ${
                          details.currentStatus.statusType === "approved" ? "bg-green-50" :
                          details.currentStatus.statusType === "rejected" ? "bg-red-50" :
                          details.currentStatus.statusType === "hold" ? "bg-orange-50" :
                          "bg-blue-50"
                        }`}>
                          <h3 className="text-lg font-semibold mb-3 text-gray-800">Current Status</h3>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Overall Status:</span> {details.currentStatus.overall}</div>
                            <div><span className="font-medium">SNP Status:</span> {details.currentStatus.snpStatus}</div>
                            <div><span className="font-medium">Audit Status:</span> {details.currentStatus.auditStatus}</div>
                            <div><span className="font-medium">Finance Admin Status:</span> {details.currentStatus.financeAdminStatus}</div>
                            <div className="pt-2">
                              <span className={`inline-block px-3 py-2 rounded-lg font-bold text-sm ${
                                details.currentStatus.statusType === "approved" ? "bg-green-200 text-green-800" :
                                details.currentStatus.statusType === "rejected" ? "bg-red-200 text-red-800" :
                                details.currentStatus.statusType === "hold" ? "bg-orange-200 text-orange-800" :
                                "bg-blue-200 text-blue-800"
                              }`}>
                                {details.currentStatus.displayStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
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