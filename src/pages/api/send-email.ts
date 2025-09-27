import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { getBillUpdateEmailContent, BillUpdateEmailData } from '../../helpers/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const emailData: BillUpdateEmailData = req.body;
  if (!emailData || !emailData.employeeEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER ,
        pass: process.env.SMTP_PASS ,
      },
    });

    const { subject, html } = getBillUpdateEmailContent(emailData);

    await transporter.sendMail({
      from: process.env.SMTP_USER ||'t@gmail.com',
      to: emailData.employeeEmail,
      subject,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    // Log error details to server console for debugging
    console.error('Email send error:', error);
    if (error?.response) {
      console.error('SMTP response:', error.response);
    }
    if (error?.code) {
      console.error('SMTP error code:', error.code);
    }
    return res.status(500).json({ error: 'Failed to send email', details: error?.message || error });
  }
}
