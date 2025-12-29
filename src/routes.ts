import { Application, Router } from "express";
import authRouter from "./modules/auth/auth.routes";
import adminRouter from "./modules/admin/admin.routes";
import ambassadorRouter from "./modules/ambassador/ambassador.routes";
import taskRouter from "./modules/task/task.routes";
import notificationRouter from "./modules/notification/notification.routes";
import complaintRouter from "./modules/complaint/complaint.routes";

const router = Router();

// Mount Auth Routes
router.use("/auth", authRouter);
// Mount Admin Routes
router.use("/admin", adminRouter);
// Mount Ambassador Routes
router.use("/ambassador", ambassadorRouter);
// Mount Task Routes
router.use("/tasks", taskRouter);
// Mount Notification Routes
router.use("/notifications", notificationRouter);
// Mount Complaint Routes
router.use("/complaints", complaintRouter);

export default router;