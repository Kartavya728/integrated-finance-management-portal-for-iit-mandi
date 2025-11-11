"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { getEmployeeByCode } from "../api/supabse"; // ✅ make sure filename is correct

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
      callbackUrl: "/",
    });

    if (res?.error) {
      setError("Login failed");
    } else if (res?.ok) {
      try {
        const session = await getSession();
        const userId = session?.user?.id;

        if (userId) {
          const employeeType = session?.user?.employee_type;
          console.log("Login successful, employee type:", employeeType);

          const routeMap: Record<string, string> = {
            "Finance Admin": "/finance-admin",
            "Finance Employee": "/finance-employee",
            "Audit": "/audit",
            "Student Purchase": "/student-purchase",
            "pda-manager": "/pda-manager",
            "bill_employee_fill": "/apply-bill",
            "bill_employee_edit": "/bill-editor",
            
          };

          const redirectUrl = employeeType && routeMap[employeeType] ? routeMap[employeeType] : "/user";
          console.log("Redirecting to:", redirectUrl);
          window.location.href = redirectUrl;
        }
      } catch (err) {
        console.error("Error during login redirection:", err);
        setError("Error during login. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#217093] px-4 sm:px-6">
      <div className="bg-white rounded-lg shadow-lg p-5 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-4 sm:mb-6">
          <img src="/iit.png" alt="IIT Mandi" className="h-12 w-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4 sm:mb-6">Log In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="LDAP-Username*"
            className="border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="LDAP-Password*"
            className="border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && (
            <div className="text-red-500 text-xs sm:text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white font-semibold rounded px-3 py-2 text-sm sm:text-base hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-4">
            Integrated Finance Management Portal - IIT Mandi
          </p>
        </form>
      </div>
    </div>
  );
}
