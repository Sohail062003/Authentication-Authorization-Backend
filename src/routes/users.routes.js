import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js"
import validate from "../middleware/validate.js";
import UserController from "../controllers/user.controller.js";
import { userPaginationSchema } from "../validations/user.validation.js";

const router = Router();

router.get("/get-user", authMiddleware,UserController.getUser);
router.get("/get-all-user", validate(userPaginationSchema, "query") ,UserController.getAllUser);
router.get("/get-all-user-by-cursor", UserController.getAllUserByCursor);

export default router;