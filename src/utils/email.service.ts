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

  /**
   * Send Task Assigned Email
   */
  static async sendTaskAssignedEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    dueDate: Date
  ) {
    const mailOptions = {
      from: `"NextIF" <${env.FROM_EMAIL}>`,
      to,
      subject: `New Task Assigned: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Hello ${firstName},</h2>
          <p>A new task has been assigned to you on the <strong>NextIF Ambassador Portal</strong>.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Task Details:</p>
            <ul style="margin: 10px 0;">
              <li><strong>Title:</strong> ${taskTitle}</li>
              <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}</li>
            </ul>
          </div>
          
          <p>Please log in to your dashboard to view the full details and start working on it.</p>
          
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send task assignment email:", error);
    }
  }

  /**
   * Send Task Redo Email
   */
  static async sendTaskRedoEmail(
    to: string,
    firstName: string,
    taskTitle: string,
    remark: string,
    newDueDate: Date
  ) {
    const mailOptions = {
      from: `"NextIF" <${env.FROM_EMAIL}>`,
      to,
      subject: `Action Required: Redo for ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #dc2626;">Redo Requested: ${taskTitle}</h2>
          <p>Hello ${firstName},</p>
          <p>The admin has reviewed your submission for <strong>${taskTitle}</strong> and requested some changes.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fee2e2;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">Admin Remark:</p>
            <p style="margin: 10px 0; color: #b91c1c;">"${remark}"</p>
            <p style="margin: 10px 0 0 0; font-weight: bold; color: #991b1b;">New Due Date:</p>
            <p style="margin: 5px 0 0 0; color: #b91c1c;">${newDueDate.toLocaleDateString()} ${newDueDate.toLocaleTimeString()}</p>
          </div>
          
          <p>Please address the feedback and resubmit the task by the new deadline.</p>
          
          <p>Best regards,<br/>The NextIF Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send task redo email:", error);
    }
  }
}
