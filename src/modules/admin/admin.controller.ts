import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Admin from "./admin.model";
import Ambassador from "../ambassador/ambassador.model";
import { hashPassword } from "../../utils/password";
import { parse } from "csv-parse/sync";
import { NotificationService } from "../notification/notification.service";
import TaskSubmission from "../task/submission.model";
import Complaint from "../complaint/complaint.model";
import Notification from "../notification/notification.model";
import Task from "../task/task.model";

/**
 * MESSAGING / ANNOUCEMENTS
 */

export const sendMessage = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { ambassadorId, title, body } = req.body;

  // Verify ambassador exists
  const ambassador = await Ambassador.findById(ambassadorId);
  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  const notification = await NotificationService.send(
    ambassadorId,
    "AMBASSADOR",
    "MESSAGE",
    title,
    body
  );

  res.status(201).json(notification);
};

export const sendAnnouncement = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { title, body } = req.body;

  // Get all Active Ambassadors
  const ambassadors = await Ambassador.find({ accountStatus: "ACTIVE" });
  const ambassadorIds = ambassadors.map((a) => a._id);

  await NotificationService.broadcast(
    ambassadorIds,
    "AMBASSADOR",
    "ANNOUNCEMENT",
    title,
    body
  );

  res
    .status(201)
    .json({
      message: `Announcement sent to ${ambassadorIds.length} ambassadors`,
    });
};

/**
 * ADMIN PROFILE
 */

export const getAdminProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  res.json(admin);
};

export const updateAdminProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { firstName, lastName, title, avatar } = req.body;
  const admin = await Admin.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, title, avatar },
    { new: true, runValidators: true }
  );
  res.json(admin);
};

export const changeAdminPassword = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.user.id).select("+password");
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect current password" });
  }

  // Hash and save new password
  admin.password = await hashPassword(newPassword);
  await admin.save();

  res.json({ message: "Password updated successfully" });
};

/**
 * AMBASSADOR MANAGEMENT
 */

export const getAllAmbassadors = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { page = 1, limit = 10, status, search } = req.query;

  const query: any = {};
  if (status) query.accountStatus = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const ambassadors = await Ambassador.find(query)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Ambassador.countDocuments(query);

  res.json({
    data: ambassadors,
    meta: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const createAmbassador = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { firstName, lastName, email, university } = req.body;

  const existing = await Ambassador.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res
      .status(400)
      .json({ message: "Ambassador with this email already exists" });
  }

  // Create with PRELOADED status
  const ambassador = await Ambassador.create({
    firstName,
    lastName,
    email,
    profile: {
      university,
    },
    accountStatus: "PRELOADED",
    passwordSet: false,
    role: "AMBASSADOR",
  });

  res.status(201).json(ambassador);
};

export const getAmbassadorById = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const ambassador = await Ambassador.findById(req.params.id);
  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }
  res.json(ambassador);
};

export const updateAmbassadorStatus = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { status } = req.body;
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status update" });
  }

  const ambassador = await Ambassador.findByIdAndUpdate(
    req.params.id,
    { accountStatus: status },
    { new: true }
  );

  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  res.json(ambassador);
};

interface CsvAmbassadorRecord {
  firstName: string;
  lastName: string;
  email: string;
  university: string;
}

export const bulkOnboardAmbassadors = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV file" });
  }

  try {
    const fileContent = req.file.buffer.toString();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvAmbassadorRecord[];

    const results = [];
    const errors = [];

    for (const record of records) {
      // Expecting email, firstName, lastName, university in CSV
      if (
        !record.email ||
        !record.firstName ||
        !record.lastName ||
        !record.university
      ) {
        errors.push({
          record,
          message:
            "Missing required fields (firstName, lastName, email, university)",
        });
        continue;
      }

      const existing = await Ambassador.findOne({
        email: record.email.toLowerCase(),
      });
      if (existing) {
        errors.push({ email: record.email, message: "Already exists" });
        continue;
      }

      const newAmbassador = await Ambassador.create({
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        profile: {
          university: record.university,
        },
        accountStatus: "PRELOADED",
        passwordSet: false,
        role: "AMBASSADOR",
      });
      results.push(newAmbassador);
    }

    res.json({
      message: "Bulk processing complete",
      successCount: results.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error parsing CSV", error });
  }
};
export const forceResetAmbassadorPassword = async (
  req: Request,
  res: Response
) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  const ambassador = await Ambassador.findByIdAndUpdate(
    id,
    {
      passwordSet: false,
      accountStatus: "PASSWORD_PENDING",
    },
    { new: true }
  );

  if (!ambassador) {
    return res.status(404).json({ message: "Ambassador not found" });
  }

  res.json({
    message:
      "Ambassador password reset triggered. They must reset on next login.",
    data: ambassador,
  });
};

export const getDashboardStats = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const [
      activeAmbassadors,
      pendingSubmissions,
      openComplaints,
      totalNotifications,
    ] = await Promise.all([
      Ambassador.countDocuments({ accountStatus: "ACTIVE" }),
      TaskSubmission.countDocuments({ status: "SUBMITTED" }),
      Complaint.countDocuments({
        status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      }),
      Notification.countDocuments({ recipientRole: "AMBASSADOR" }),
    ]);

    const recentActivity = await TaskSubmission.find()
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate({
        path: "ambassadorId",
        select: "firstName lastName",
      })
      .populate({
        path: "taskId",
        select: "title",
      });

    res.json({
      stats: {
        activeAmbassadors,
        pendingSubmissions,
        openComplaints,
        messagesSent: totalNotifications,
      },
      recentActivity: recentActivity.map((item) => ({
        id: item._id,
        ambassadorName: item.ambassadorId
          ? `${(item.ambassadorId as any).firstName} ${
              (item.ambassadorId as any).lastName
            }`
          : "Unknown",
        taskTitle: item.taskId ? (item.taskId as any).title : "Unknown Task",
        status: item.status,
        time: item.submittedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats", error });
  }
};

export const deleteAmbassador = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const ambassador = await Ambassador.findByIdAndDelete(req.params.id);
    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }
    res.json({ message: "Ambassador deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ambassador", error });
  }
};
