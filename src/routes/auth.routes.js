import { Router } from "express";
import { AuthController } from "../controllers/index.js";

const router = Router();

router.get("/get-user", AuthController.getUser);
router.get("/refresh-token", AuthController.refreshToken);
router.post("/register", AuthController.register);


// module.exports = router;
export default router;

