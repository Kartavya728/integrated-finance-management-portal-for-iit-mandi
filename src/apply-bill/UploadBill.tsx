import { Employee, Bill, PDABalance } from "@/types/database";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BillFormData } from "@/types/bill";
import { normalizeEmployeeId } from "@/utils/employeeIdNormalizer";

interface UploadBillProps {
  department?: string | null;
  onBillSubmitted?: () => void;
}

const UploadBill: React.FC<UploadBillProps> = ({ onBillSubmitted, department }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [applicantDepartment, setApplicantDepartment] = useState<string | null>(null);
  const [formData, setFormData] = useState<BillFormData>({
    employee_id: "",
    bill_date: "",
    bill_amount: 0,
    bill_description: "",
    bill_type: "Expense",
    bill_category: "Travel",
    bill_status: "Pending",
    bill_notes: "",
    bill_receipt: null,
  });

  // Fetch applicant department when employee_id changes
  useEffect(() => {
    const fetchApplicantDept = async () => {
      const id = formData.employee_id?.trim();
      if (!id) {
        setApplicantDepartment(null);
        return;
      }
      try {
        const normalizedId = normalizeEmployeeId(id);
        const { data, error } = await supabase
          .from("employees")
          .select("department")
          .eq("id", normalizedId)
          .single();
        if (error) {
          setApplicantDepartment(null);
          return;
        }
        setApplicantDepartment(data?.department ?? null);
      } catch (e) {
        setApplicantDepartment(null);
      }
    };
    fetchApplicantDept();
  }, [formData.employee_id]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Upload Bill{department ? ` for ${department}` : ''}</h1>
      {/* ...form fields and content... */}
      {balance !== null && (
        <div className="col-span-2 flex justify-between items-center text-gray-600">
          <span>Current PDA Balance: ₹ {balance.toFixed(2)}</span>
          {applicantDepartment && (
            <span className="font-medium text-gray-800">applicants department: {applicantDepartment}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadBill;
