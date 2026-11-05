import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null

if (!transporter) {
  console.warn(
    'SMTP_HOST is not set: emails will be printed in this console instead of being sent.',
  )
}

export async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(
      `\n--- [email not sent: SMTP not configured] ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---------------------------------------------\n`,
    )
    return
  }
  await transporter.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text })
}
