import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { supabase } from "../../utils/supabase/client";
import QRCode from "qrcode";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { po_details, supplier_name, po_value } = body;

    // 1️⃣ Find employee by username
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

    // 2️⃣ Insert bill
    const { data: bill, error } = await supabase
      .from("bills")
      .insert([
        {
          po_details,
          supplier_name,
          po_value,
          status: "Pending",
          employee_id: employee.id,
        },
      ])
      .select("id")
      .single();

    if (error || !bill) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3️⃣ Create static HTML page content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bill ${bill.id}</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              padding: 2rem;
              background-color: #f9fafb;
              color: #111827;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Bill Details</h1>
            <p><strong>Supplier:</strong> ${supplier_name}</p>
            <p><strong>PO Details:</strong> ${po_details}</p>
            <p><strong>PO Value:</strong> ${po_value}</p>
            <p><strong>Status:</strong> Pending</p>
            <p style="margin-top:1rem;font-size:0.9rem;color:gray;">
              This is a static version of the bill. Data might not reflect updates.
            </p>
          </div>
        </body>
      </html>
    `;

    // 4️⃣ Write the HTML file to /public/static-bills
    const htmlDir = path.join(process.cwd(), "public", "static-bills");
    const qrDir = path.join(htmlDir, "qrs");
    await fs.mkdir(htmlDir, { recursive: true });
    await fs.mkdir(qrDir, { recursive: true });

    const htmlPath = path.join(htmlDir, `${bill.id}.html`);
    await fs.writeFile(htmlPath, htmlContent, "utf-8");

    // 5️⃣ Generate QR code pointing to this static page
    const qrURL = `${process.env.NEXT_PUBLIC_BASE_URL}/static-bills/${bill.id}.html`;
    const qrPath = path.join(qrDir, `${bill.id}.png`);
    await QRCode.toFile(qrPath, qrURL, { width: 300 });

    const qrPublicURL = `${process.env.NEXT_PUBLIC_BASE_URL}/static-bills/qrs/${bill.id}.png`;

    // ✅ Return local URLs
    return NextResponse.json({
      message: "Bill saved successfully",
      id: bill.id,
      static_page: `/static-bills/${bill.id}.html`,
      qr_image: `/static-bills/qrs/${bill.id}.png`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
