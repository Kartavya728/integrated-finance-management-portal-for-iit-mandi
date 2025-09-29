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
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const { subject, html } = getBillUpdateEmailContent(emailData);

    await transporter.sendMail({
      from: process.env.SMTP_USER || 't@gmail.com',
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
