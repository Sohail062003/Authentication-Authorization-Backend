import { Router } from "express";
import  rateLimiter  from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";
import { registerSchema } from "../validations/auth.validation.js";
import { AuthController } from "../controllers/index.js";

const router = Router();

// post request
router.post("/register", validate(registerSchema) ,rateLimiter, AuthController.register);
router.post("/login", rateLimiter, AuthController.login);

// get request
router.get("/refresh-token", AuthController.refreshToken);
router.get("/logout", AuthController.logout);
router.get("/logout-all", AuthController.logoutAll);

export default router;

