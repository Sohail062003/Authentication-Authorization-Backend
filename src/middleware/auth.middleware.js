import jwt from "jsonwebtoken"
import config from "../config/config.js"


const authMiddleware = (req, res, next) => {
    try {
        // 1. Get Authorization Header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                status: "failed",
                message: "Authorization token not found"
            });
        }

        // 2. extract the token 
        const token = authHeader.split(" ")[1]; // skip berear 

        if (!token) {
            return res.status(401).json({
                status: "failed",
                message: "Invalid authorization format"
            });
        }

        // 3. verify the token 
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // 4. Attach decoded user information to request
        req.user = decoded;

        // 5. Continue to controller
        next();

    } catch (error) {
        return res.status(401).json({
            status: "failed",
            message: "Invalid or expired token"
        });
    }
}

export default authMiddleware;
