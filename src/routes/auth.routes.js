import { Router } from "express";
import { AuthController } from "../controllers/index.js";

const router = Router();

router.post("/register", AuthController.register);
router.get("/get-user", AuthController.getUser);
router.get("/refresh-token", AuthController.refreshToken);
router.get("/logout", AuthController.logout);

// module.exports = router;
export default router;

