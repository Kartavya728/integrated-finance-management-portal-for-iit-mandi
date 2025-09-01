import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import React from "react";
import { FinanceSidebar } from "@/components/FinanceSidebar";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return (
    <main className="flex min-h-screen bg-white">
      <FinanceSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Bills Status</h1>
        <p className="mt-2 text-gray-600">
          No bill in processing at the moment.
        </p>
      </div>
    </main>
  );
}