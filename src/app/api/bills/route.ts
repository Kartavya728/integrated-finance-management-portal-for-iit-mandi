import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { supabase } from "../../utils/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { po_details, supplier_name, po_value } = body;

    // 1. Find employee by username
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("username", session.user.username)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { error: "Error verifying employee." },
        { status: 400 }
      );
    }

    // 2. Insert bill with employee_id = employee.id
    const { data, error } = await supabase.from("bills").insert([
      {
        po_details,
        supplier_name,
        po_value,
        status: "Pending",
        employee_id: employee.id, // ✅ Correct foreign key usage
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Bill saved successfully", data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
