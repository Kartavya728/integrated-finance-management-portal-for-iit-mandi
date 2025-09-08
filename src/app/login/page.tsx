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
      const session = await getSession();
      const userId = session?.user?.id;

      if (userId) {
        const session = await getSession();
        const employeeType = session?.user?.employee_type;

        const routeMap: Record<string, string> = {
          "Finance Admin": "/finance-admin",
          "Finance Employee": "/finance-employee",
          "Audit": "/audit",
          "Student Purchase": "/student-purchase",
        };

        window.location.href = employeeType && routeMap[employeeType] ? routeMap[employeeType] : "/user";
        
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#217093]">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-semibold text-center mb-6">Log In</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="LDAP-Username*"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="LDAP-Password*"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="mt-2 bg-blue-600 text-white font-semibold rounded px-3 py-2 hover:bg-blue-700 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
