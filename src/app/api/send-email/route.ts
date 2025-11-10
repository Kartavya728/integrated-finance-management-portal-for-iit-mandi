import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getBillUpdateEmailContent, BillUpdateEmailData } from '../../../helpers/mailer';

export async function POST(req: NextRequest) {
  const emailData: BillUpdateEmailData = await req.json();
  if (!emailData || !emailData.employeeEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user:process.env.EMAIL,        // your Gmail address
        pass: process.env.EMAIL_PASSWORD,          // your Gmail app password
      },
    });

    const { subject, html } = getBillUpdateEmailContent(emailData);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: emailData.employeeEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Email send error:', error);
    if (error?.response) {
      console.error('SMTP response:', error.response);
    }
    if (error?.code) {
      console.error('SMTP error code:', error.code);
    }
    return NextResponse.json({ error: 'Failed to send email', details: error?.message || error }, { status: 500 });
  }
}
