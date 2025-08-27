"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
  IconArrowLeft,
  IconSettings,
  IconUserBolt,
  IconReceipt2,
  IconWallet,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function FinanceSidebar() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconWallet className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "My Profile",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Bills & Applications",
      href: "#",
      icon: (
        <IconReceipt2 className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-gray-300 bg-white md:flex-row",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "IIT Mandi User",
                href: "#",
                icon: (
                  <img
                    src="iit.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="IIT Mandi Logo"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Dashboard */}
      <FinanceDashboard />
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-semibold text-black"
    >
      <img
        src="iit.png"
        alt="IIT Mandi"
        className="h-7 w-7"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre text-black"
      >
        IIT Mandi Finance
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-semibold text-black"
    >
      <img
        src="./iit.png"
        alt="IIT Mandi"
        className="h-7 w-7"
      />
    </a>
  );
};

// Finance Dashboard (Main Content)
const FinanceDashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-gray-300 bg-white p-6">
        {/* Balance Card */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">PDA Balance</h2>
          <p className="mt-2 text-2xl font-bold text-green-600">₹ 1,20,000</p>
        </div>

        {/* Bills Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Bill Applications
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
            <li>Conference Registration – Pending</li>
            <li>Lab Equipment Purchase – Approved</li>
            <li>Travel Reimbursement – Under Review</li>
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">

        </div>
      </div>
    </div>
  );
};
