"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function BillForm({ bill }: { bill?: any }) {
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  const router = useRouter();

  const username = session?.user?.username; // must exist in your NextAuth session

  const [balance, setBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    po_details: bill?.po_details || "",
    po_value: bill?.po_value || "",
    supplier_name: bill?.supplier_name || "",
    supplier_address: bill?.supplier_address || "",
    item_category: bill?.item_category || "",
    item_description: bill?.item_description || "",
    qty: bill?.qty || 1,
    bill_details: bill?.bill_details || "",
    indenter_name: bill?.indenter_name || "",
    qty_issued: bill?.qty_issued || 1,
    source_of_fund: bill?.source_of_fund || "",
    stock_entry: bill?.stock_entry || "",
    location: bill?.location || "",
  });

  // ✅ Fetch PDA balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!username) return;

      const { data: balanceData, error } = await supabase
        .from("pda_balances")
        .select("balance")
        .eq("employee_id", username)
        .single();

      if (!error && balanceData) {
        setBalance(balanceData.balance);
      }
    };

    fetchBalance();
  }, [username, supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      alert("You must be logged in to submit a bill.");
      return;
    }

    const poValue = parseFloat(formData.po_value || "0");

    // ✅ Check PDA balance
    if (poValue > balance) {
      alert("Insufficient PDA balance to submit this bill.");
      return;
    }

    // ✅ Check category if > 50k
    if (poValue > 50000 && formData.item_category === "Minor") {
      alert("Bills above 50k cannot have category 'Minor'.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Decide bill stage
      let snp: string | null = null;
      let audit: string | null = null;

      if (poValue > 50000) {
        snp = "Pending";
        audit = null;
      } else {
        snp = null;
        audit = "Pending";
      }

      let res;
      if (bill) {
        res = await supabase.from("bills").update(formData).eq("id", bill.id);
      } else {
        res = await supabase.from("bills").insert([
          {
            ...formData,
            employee_id: username,
            status: "Student Purchase",
            snp,
            audit,
          },
        ]);
      }

      if (res.error) {
        console.error("Error saving bill:", res.error.message);
        alert("Failed to save bill.");
      } else {
        // ✅ Subtract from balance
        await supabase
          .from("pda_balances")
          .update({ balance: balance - poValue })
          .eq("employee_id", username);

        alert("Bill saved successfully!");
        router.push("/user"); // redirect
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto"
    >
      {/* Website Title */}
      <h1 className="text-2xl font-bold text-center mb-4">
        IIT Mandi Finance Portal
      </h1>

      {/* Show PDA Balance */}
      <div className="flex justify-between items-center mb-6">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => alert(`PDA Balance: ₹ ${balance.toLocaleString()}`)}
        >
          Show PDA Balance
        </button>
        <span className="text-lg font-semibold">
          Balance: ₹ {balance.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PO Details */}
        <div>
          <label className="block text-sm font-medium mb-1">
            PO Details (No. & Date)
          </label>
          <input
            name="po_details"
            value={formData.po_details}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* PO Value */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Purchase Order Value (Rs.)
          </label>
          <input
            type="number"
            name="po_value"
            value={formData.po_value}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Source of Fund */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Source of Fund
          </label>
          <input
            name="source_of_fund"
            value={formData.source_of_fund}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Supplier Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Supplier Name</label>
          <input
            name="supplier_name"
            value={formData.supplier_name}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Supplier Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Supplier Address
          </label>
          <input
            name="supplier_address"
            value={formData.supplier_address}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Item Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Item Category</label>
          <select
            name="item_category"
            value={formData.item_category}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          >
            <option value="">Select category</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Consumable">Consumable</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Item Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Item Description with Specification
          </label>
          <textarea
            name="item_description"
            value={formData.item_description}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Qty */}
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            name="qty"
            min="1"
            value={formData.qty}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Qty Issued */}
        <div>
          <label className="block text-sm font-medium mb-1">Quantity Issued</label>
          <input
            type="number"
            name="qty_issued"
            min="1"
            value={formData.qty_issued}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Bill Details */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Bill Details (No., Date, Value)
          </label>
          <input
            name="bill_details"
            value={formData.bill_details}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Indenter */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Indenter / Issued To
          </label>
          <input
            name="indenter_name"
            value={formData.indenter_name}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        {/* Stock Entry */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Stock Entry (No., Page, S.No.)
          </label>
          <input
            name="stock_entry"
            value={formData.stock_entry}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-48 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : bill ? "Update Bill" : "Submit Bill"}
        </button>
      </div>
    </form>
  );
}
