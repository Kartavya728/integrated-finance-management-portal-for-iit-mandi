"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import for react-qr-code
const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

const BillQRCodePage: React.FC = () => {
  const { id } = useParams();
  const [qrURL, setQrURL] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      setQrURL(`${window.location.origin}/bill/${id}`);
    }
  }, [id]);

  const handlePrint = () => {
    const qrContainer = document.getElementById("qr-container");
    if (!qrContainer) return;

    const newWindow = window.open("", "_blank");
    if (!newWindow) return;

    newWindow.document.write(`
      <html>
        <head><title>Print QR</title></head>
        <body>${qrContainer.innerHTML}</body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
  };

  if (!id) return <div>Invalid Bill ID</div>;
  if (!qrURL) return <div>Loading QR...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-50 rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Bill QR Code</h1>
      <div
        id="qr-container"
        className="p-4 bg-white rounded shadow mb-4 flex justify-center"
      >
        <QRCode value={qrURL} size={256} />
      </div>
      <button
        onClick={handlePrint}
        className="w-full bg-blue-600 text-white py-2 rounded shadow"
      >
        Print QR Code
      </button>
    </div>
  );
};

export default BillQRCodePage;
