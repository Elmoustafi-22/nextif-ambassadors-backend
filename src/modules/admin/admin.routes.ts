import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";
import { upload } from "../../middlewares/upload.middleware";
import {
  getAdminProfile,
  updateAdminProfile,
  getAllAmbassadors,
  createAmbassador,
  getAmbassadorById,
  updateAmbassadorStatus,
  updateAmbassador,
  bulkOnboardAmbassadors,
  sendMessage,
  sendAnnouncement,
  forceResetAmbassadorPassword,
  getDashboardStats,
  changeAdminPassword,
  deleteAmbassador,
} from "./admin.controller";

const adminRouter = Router();

// Protect all routes with Auth and Admin Role
adminRouter.use(protect);
adminRouter.use(role(["ADMIN"]));

// Admin Profile
adminRouter.get("/me", getAdminProfile);
adminRouter.patch("/me", updateAdminProfile);
adminRouter.patch("/change-password", changeAdminPassword);

// Dashboard Stats
adminRouter.get("/stats", getDashboardStats);

// Messaging / Announcements
adminRouter.post("/messages", sendMessage);
adminRouter.post("/announcements", sendAnnouncement);

// Ambassador Management (Admin View)
adminRouter.post(
  "/ambassadors/bulk",
  upload.single("file"),
  bulkOnboardAmbassadors
); // Bulk Import
adminRouter.get("/ambassadors", getAllAmbassadors);
adminRouter.post("/ambassadors", createAmbassador);
adminRouter.get("/ambassadors/:id", getAmbassadorById);
adminRouter.patch("/ambassadors/:id", updateAmbassador);
adminRouter.patch("/ambassadors/:id/status", updateAmbassadorStatus);
adminRouter.post("/ambassadors/:id/force-reset", forceResetAmbassadorPassword);
adminRouter.delete("/ambassadors/:id", deleteAmbassador);

export default adminRouter;
