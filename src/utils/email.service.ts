import nodemailer from "nodemailer";
import { env } from "../config/env";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  /**
   * Send Welcome Email to New Ambassador
   */
  static async sendAmbassadorWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string
  ) {
    const loginUrl = env.FRONTEND_URL;

    const mailOptions = {
      from: `"NextIF" <${env.FROM_EMAIL}>`,
      to,
      subject: "Welcome to the NextIF Ambassador Portal!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome, ${firstName}!</h2>
          <p>You have been officially added as an ambassador to the <strong>NextIF Ambassador Portal</strong>.</p>
          
          <p>To get started, please log in to your dashboard to complete your profile and view your assignments.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Login Instructions:</p>
            <ul style="margin: 10px 0;">
              <li><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
              <li><strong>Username:</strong> ${to}</li>
              <li><strong>Initial Password:</strong> Use your <strong>Last Name</strong> (case-sensitive)</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9em;">Important: You will be required to set a new password immediately after your first successful login.</p>
          
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Welcome email sent: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw error;
    }
  }
}
