import { Request, Response } from "express";
import Task from "./task.model";
import TaskSubmission from "./submission.model";
import Notification from "../notification/notification.model";
import { Types } from "mongoose";

/**
 * SHARED: TASK VIEWING
 */

export const getTaskById = async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // If ambassador, check if assigned and attach submission status
  if (req.user?.role === "AMBASSADOR") {
    if (!task.assignedTo.map((id) => id.toString()).includes(req.user.id)) {
      return res.status(403).json({ message: "Task not assigned to you" });
    }

    const submission = await TaskSubmission.findOne({
      taskId: task._id,
      ambassadorId: req.user.id,
    });

    return res.json({
      ...task.toObject(),
      status: submission ? submission.status : "PENDING",
    });
  }

  res.json(task);
};

/**
 * ADMIN: TASK MANAGEMENT
 */

export const createTask = async (req: Request, res: Response) => {
  const {
    title,
    explanation,
    type,
    verificationType,
    dueDate,
    assignedTo,
    rewardPoints,
    isBonus,
    requirements,
    whatToDo,
    materials,
  } = req.body;

  const task = await Task.create({
    title,
    explanation,
    type,
    verificationType,
    dueDate,
    assignedTo,
    rewardPoints,
    isBonus,
    requirements,
    whatToDo: whatToDo || [],
    materials: materials || [],
  });

  res.status(201).json(task);
};

export const getAllTasks = async (req: Request, res: Response) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
};

export const updateTask = async (req: Request, res: Response) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  // Optional: Delete related submissions? Keeping them for history might be better.
  // await TaskSubmission.deleteMany({ taskId: req.params.id });

  res.json({ message: "Task deleted successfully" });
};

/**
 * ADMIN: SUBMISSION VIEWING
 */

export const getSubmissions = async (req: Request, res: Response) => {
  const { taskId, ambassadorId, status } = req.query;

  const query: any = {};
  if (taskId) query.taskId = taskId;
  if (ambassadorId) query.ambassadorId = ambassadorId;
  if (status) query.status = status;

  const submissions = await TaskSubmission.find(query)
    .populate("ambassadorId", "firstName lastName email university")
    .populate("taskId", "title")
    .sort({ submittedAt: -1 });

  res.json(submissions);
};

/**
 * ADMIN: SUBMISSION VERIFICATION
 */

export const verifySubmission = async (req: Request, res: Response) => {
  const { status, feedback } = req.body; // "COMPLETED" or "REJECTED"
  const { id } = req.params; // Submission ID

  if (!["COMPLETED", "REJECTED"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Use COMPLETED or REJECTED." });
  }

  const submission = await TaskSubmission.findByIdAndUpdate(
    id,
    {
      status,
      adminFeedback: feedback,
      reviewedAt: new Date(),
    },
    { new: true }
  ).populate("taskId", "title");

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  // Notify Ambassador
  try {
    const taskTitle = (submission.taskId as any).title;
    await Notification.create({
      recipientId: submission.ambassadorId,
      recipientRole: "AMBASSADOR",
      type: "MESSAGE",
      title: `Submission Update: ${taskTitle}`,
      body: `Your submission has been ${status}. ${
        feedback ? `Remark: "${feedback}"` : ""
      }`,
      read: false,
      referenceId: (submission.taskId as any)._id,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }

  res.json(submission);
};

/**
 * AMBASSADOR: MY TASKS
 */

export const getMyTasks = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  // 1. Get tasks assigned to this ambassador
  const tasks = await Task.find({
    assignedTo: req.user.id,
  }).sort({ dueDate: 1 });

  // 2. Get submissions for these tasks by this ambassador
  const submissions = await TaskSubmission.find({
    ambassadorId: req.user.id,
    taskId: { $in: tasks.map((t) => t._id) },
  });

  // 3. Merge data
  console.log(
    `Getting tasks for user ${req.user.id}. Total found: ${tasks.length}`
  );
  tasks.forEach((t) =>
    console.log(
      `- Task: ${t.title}, Due: ${t.dueDate.toISOString()}, isBonus: ${
        t.isBonus
      }`
    )
  );

  const result = tasks.map((task) => {
    const submission = submissions.find(
      (s) => s.taskId.toString() === task._id.toString()
    );
    return {
      ...task.toObject(),
      status: submission ? submission.status : "PENDING",
      submission: submission || null,
    };
  });

  res.json(result);
};

export const submitTask = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params; // taskId from URL
  let { content, links, responses } = req.body; // text content, links array, and step responses

  // Parse responses if sent as string (FormData sends arrays/objects as strings)
  if (typeof responses === "string") {
    try {
      responses = JSON.parse(responses);
    } catch (e) {
      console.error("Failed to parse responses JSON:", e);
    }
  }

  // Parse links if sent as string/array from FormData
  if (typeof links === "string") {
    try {
      links = JSON.parse(links);
    } catch (e) {
      links = [links];
    }
  }

  // If files were uploaded via multer, they will be in req.files
  const files = req.files as Express.Multer.File[];
  const proofFiles = files
    ? files.map((f) => f.path)
    : req.body.proofFiles || [];

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  // Check if assigned
  if (!task.assignedTo.map((aid) => aid.toString()).includes(req.user.id)) {
    return res.status(403).json({ message: "Task not assigned to you" });
  }

  // Check deadline
  if (new Date() > new Date(task.dueDate)) {
    return res.status(400).json({ message: "Submission deadline has passed" });
  }

  // Determine Status: Always COMPLETED upon submission as per request
  const status = "COMPLETED";

  console.log(
    `Submitting task ${id} for user ${req.user.id}, setting status to ${status}`
  );

  // Upsert submission
  const submission = await (TaskSubmission as any).findOneAndUpdate(
    { taskId: id, ambassadorId: req.user.id },
    {
      taskId: id,
      ambassadorId: req.user.id,
      proofFiles,
      links,
      responses,
      content,
      status,
      submittedAt: new Date(),
    },
    { new: true, upsert: true }
  );

  res.json(submission);
};
