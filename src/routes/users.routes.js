import { Router } from "express";
import UserController from "../controllers/user.controller.js";

const router = Router();

router.get("/get-user", UserController.getUser);

router.get("/get-all-user", UserController.getAllUser);

router.get(
    "/get-all-user-by-cursor",
    UserController.getAllUserByCursor
);

export default router;