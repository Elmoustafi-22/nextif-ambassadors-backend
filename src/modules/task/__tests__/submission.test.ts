import { Request, Response } from "express";
import { verifySubmission } from "../task.controller";
import TaskSubmission from "../submission.model";
import Notification from "../../notification/notification.model";

// Mock the models
// Mock the models
jest.mock("../submission.model", () => ({
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("../../notification/notification.model", () => ({
  create: jest.fn(),
}));

describe("Task Controller - verifySubmission", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    req = {
      params: { id: "submission123" },
      body: {},
    };
    jsonMock = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it("should update submission status and add feedback", async () => {
    req.body = { status: "COMPLETED", feedback: "Great job!" };

    const mockSubmission = {
      _id: "submission123",
      status: "COMPLETED",
      adminFeedback: "Great job!",
      ambassadorId: {
        _id: "ambassador123",
        firstName: "John",
        lastName: "Doe",
      },
      taskId: { _id: "task123", title: "Test Task" },
    };

    // Mock findByIdAndUpdate to return the mock submission with chained populate
    const populateMock = jest.fn().mockReturnThis();
    (TaskSubmission.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: populateMock,
      exec: jest.fn().mockResolvedValue(mockSubmission),
    });
    // For chained populate, the last one usually returns a promise if called with await
    // Mongoose queries are thenable.
    // Simplified Mock:
    (TaskSubmission.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: jest.fn(function (resolve) {
        resolve(mockSubmission);
      }),
    });

    await verifySubmission(req as Request, res as Response);

    // Verify update call checks for feedback
    expect(TaskSubmission.findByIdAndUpdate).toHaveBeenCalledWith(
      "submission123",
      expect.objectContaining({
        status: "COMPLETED",
        adminFeedback: "Great job!",
      }),
      { new: true }
    );

    // Verify notification creation
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: "ambassador123",
        type: "MESSAGE",
        body: expect.stringContaining("Great job!"),
        referenceId: "task123",
      })
    );

    expect(res.json).toHaveBeenCalledWith(mockSubmission);
  });

  it("should return 400 for invalid status", async () => {
    req.body = { status: "INVALID" };
    await verifySubmission(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
