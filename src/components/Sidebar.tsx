"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users,
  IndianRupee,
  LogOut,
  Building2,
  Menu,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { supabase } from "../app/utils/supabase/client";

interface Employee {
  id: string;
  employee_code: string;
  employee_type: string;
  email?: string;
  username: string;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getNavigationItems = (
  employeeType: string | null,
  isEmployee: boolean
): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  ];

  if (!isEmployee) {
    return [
      ...baseItems,
      { title: "My Bills", url: "/user", icon: FileText },
    ];
  }

  if (employeeType === "Finance Admin") {
    return [
      ...baseItems,
      { title: "All Bills", url: "/bills", icon: FileText },
      { title: "Employees", url: "/employees", icon: Users },
      { title: "PDA Balance", url: "/pda-balance", icon: IndianRupee },
    ];
  } else if (employeeType === "Finance Employee") {
    return [
      ...baseItems,
      { title: "Submit Bill", url: "/submit-bill", icon: FileText },
      { title: "Track Bills", url: "/track-bills", icon: FileText },
      { title: "PDA Balance", url: "/pda-balance", icon: IndianRupee },
    ];
  } else if (
    employeeType === "Student Purchase" ||
    employeeType === "Audit"
  ) {
    return [
      ...baseItems,
      { title: "Workflow Status", url: "/workflow-status", icon: FileText },
    ];
  }

  return baseItems;
};

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    const checkEmployee = async () => {
      if (!session?.user?.username) return;

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("username", session.user.username)
        .single();

      if (data && !error) {
        setEmployee(data);
        setIsEmployee(true);
      } else {
        setIsEmployee(false);
        setEmployee(null);
      }
    };

    checkEmployee();
  }, [session]);

  const navigationItems = getNavigationItems(
    employee?.employee_type || null,
    isEmployee
  );

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200
          md:relative md:translate-x-0 md:z-auto md:block
        `}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">IIT Mandi</h2>
            <p className="text-xs opacity-80">Finance Portal</p>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const active = pathname === item.url;
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      active ? "text-blue-700" : "text-gray-500"
                    }`}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4 backdrop-blur-md bg-white/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium text-sm">
                  {employee?.email?.charAt(0).toUpperCase() ||
                    session?.user?.username?.charAt(0).toUpperCase() ||
                    "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {employee?.employee_code || session?.user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {employee?.employee_type || "General User"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-0">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-blue-700">
              IIT Mandi Finance Portal
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
