import nodemailer from 'nodemailer';
import fs from 'fs';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  attachmentPath?: string;
}

export async function sendEmail({ to, subject, text, attachmentPath }: SendEmailOptions) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false, 
    auth: {
      user: 'apikey', 
      pass: "",
    },
  });

  const mailOptions: any = {
    from: 'goel13jan2003@gmail.com', 
    to,
    subject,
    text: text || 'See attached transcript',
  };

  if (attachmentPath) {
    mailOptions.attachments = [
      {
        filename: attachmentPath.split('/').pop(),
        path: attachmentPath,
      },
    ];
  }

  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}`);
}
