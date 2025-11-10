"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SidebarLayout from "@/components/Sidebar";

type PdaBalance = {
  id: string;
  employee_id: string;
  balance: number;
  updated_at: string;
  department: string;
};

export default function PdaManagerPage() {
  const [pdaBalances, setPdaBalances] = useState<PdaBalance[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBalance, setNewBalance] = useState({ employee_id: "", balance: 0, department: "" });
  const [editingBalance, setEditingBalance] = useState<PdaBalance | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

/*  useEffect(() => {
    if (session?.user?.role !== "pda-manager") {
      router.push("/login");
    }
  }, [session, router]);*/
  
  useEffect(() => {
    const fetchPdaBalances = async () => {
      const { data, error } = await supabase.from("pda_balances").select("*");
      if (error) {
        console.error("Error fetching pda_balances:", error);
      } else {
        setPdaBalances(data as PdaBalance[]);
      }
    };
    fetchPdaBalances();
  }, []);

  const handleAddBalance = async () => {
    const { data, error } = await supabase.from("pda_balances").insert([newBalance]);
    if (error) {
      console.error("Error adding balance:", error);
    } else {
      setPdaBalances([...pdaBalances, ...(data as PdaBalance[])]);
      setIsAdding(false);
      setNewBalance({ employee_id: "", balance: 0, department: "" });
    }
  };

  const handleEditBalance = async () => {
    if (!editingBalance) return;
    const { data, error } = await supabase
      .from("pda_balances")
      .update({ 
        employee_id: editingBalance.employee_id, 
        balance: editingBalance.balance, 
        department: editingBalance.department, 
        updated_at: new Date().toISOString()
      })
      .eq("id", editingBalance.id);

    if (error) {
      console.error("Error updating balance:", error);
    } else {
      setPdaBalances(
        pdaBalances.map((b) => (b.id === editingBalance.id ? (data as PdaBalance[])[0] : b))
      );
      setEditingBalance(null);
    }
  };

  const handleDeleteBalance = async (id: string) => {
    const { error } = await supabase.from("pda_balances").delete().eq("id", id);
    if (error) {
      console.error("Error deleting balance:", error);
    } else {
      setPdaBalances(pdaBalances.filter((b) => b.id !== id));
    }
  };

  return (
    <SidebarLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">PDA Manager</h1>
        <div className="mb-4">
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Balance
        </button>
      </div>
      {isAdding && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Add New PDA Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Employee ID"
              value={newBalance.employee_id}
              onChange={(e) => setNewBalance({ ...newBalance, employee_id: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Balance"
              value={newBalance.balance}
              onChange={(e) => setNewBalance({ ...newBalance, balance: parseFloat(e.target.value) })}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Department"
              value={newBalance.department}
              onChange={(e) => setNewBalance({ ...newBalance, department: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddBalance}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Employee ID</th>
              <th className="py-2 px-4 border-b">Balance</th>
              <th className="py-2 px-4 border-b">Department</th>
              <th className="py-2 px-4 border-b">Last Updated</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pdaBalances.map((balance) => (
              <tr key={balance.id}>
                <td className="py-2 px-4 border-b">{balance.employee_id}</td>
                <td className="py-2 px-4 border-b">{balance.balance}</td>
                <td className="py-2 px-4 border-b">{balance.department}</td>
                <td className="py-2 px-4 border-b">{new Date(balance.updated_at).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">
                  <button onClick={() => setEditingBalance(balance)} className="text-blue-500 hover:underline">Edit</button>
                  <button onClick={() => handleDeleteBalance(balance.id)} className="text-red-500 hover:underline ml-2">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingBalance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Edit PDA Balance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Employee ID"
                value={editingBalance.employee_id}
                onChange={(e) => setEditingBalance({ ...editingBalance, employee_id: e.target.value })}
                className="border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Balance"
                value={editingBalance.balance}
                onChange={(e) => setEditingBalance({ ...editingBalance, balance: parseFloat(e.target.value) })}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Department"
                value={editingBalance.department}
                onChange={(e) => setEditingBalance({ ...editingBalance, department: e.target.value })}
                className="border p-2 rounded"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={handleEditBalance}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={() => setEditingBalance(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}