
import nodemailer from "nodemailer";

// Requires 2FA enabled on the Gmail account + an App Password
// (not your regular Gmail password). Generate one at:
// https://myaccount.google.com/apppasswords
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Used as the "from" address when scheduling — Gmail SMTP only lets you
// send as the account you authenticated with, so this must match GMAIL_USER.
export const FROM_ADDRESS = process.env.GMAIL_USER || "";