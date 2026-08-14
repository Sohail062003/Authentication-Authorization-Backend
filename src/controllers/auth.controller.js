import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";

class AuthController {


    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            const isAlreadyUserExist = await userModel.findOne({
                $or: [
                    { username },
                    { email}
                ]
            })

            if (isAlreadyUserExist) {
                res.status(409).json({
                    status: "failed",
                    message: "User or email already exits"
                });
            }

            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

            const user = await userModel.create({
                username,
                email,
                password: hashedPassword
            });

            const refreshToken = jwt.sign(
                {
                    id: user._id
                },
                config.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            )

            const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
            console.log(refreshTokenHash)

            const session = await sessionModel.create({
                user: user._id,
                refreshToken: refreshTokenHash,
                ip: req.ip,
                userAgent: req.headers[ "user-agent" ],
                
            })

            const accessToken = jwt.sign(
                {
                    id: user._id,
                    sessionId: session._id
                }, 
                config.JWT_SECRET,
                {
                    expiresIn: "15m"
                }
            )


            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7d 
            })

            const data = {
                username: user.username,
                email: user.email,
            }

            return res.status(201).json({
                status: "success",
                message: "User register successfully",
                data: data,
                accessToken
            });


        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error" + error
            })
        }
        
    }

    static async login(req, res) {
        try {
            const {email, password} = req.body
            const user = await userModel.findOne({ email });
            console.log("login controller");
            if (!user) {
                return res.status(401).json({
                    status: "failed",
                    message: "Invalid email or password"
                });
            }

            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

            const isPasswordValid = hashedPassword === user.password;

            if (!isPasswordValid) {
                return res.status(401).json({
                    status: "failed",
                    message: "Invalid email or password"
                });
            }

            const refreshToken = jwt.sign({
               id: user._id 
            }, config.JWT_SECRET,
            {
                expiresIn: "7d"
            });

            const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");


            const session = await sessionModel.create({
                user: user._id,
                refreshToken: refreshTokenHash,
                ip: req.ip,
                userAgent: req.headers[ "user-agent" ]
            });

            const accessToken = jwt.sign({
                   id: user._id,
                   sessionId: session._id
                }, config.JWT_SECRET,
                {
                    expiresIn: "15m"
                }
            );

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
            });

            const data = {
                username: user.username,
                email: user.email
            }

            return res.status(200).json({
                status: "success",
                message: "Logged in successfully",
                data: data,
                accessToken
            });

        } catch (error) {
            return res.status(500).json({
                status: "Error",
                message: "Internal Server Error: " + error
            })
        }
    }

    static async refreshToken(req, res){
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    status: "failed",
                    message: "refreshToken not found"
                });
            }

            const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

            const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

            const session = await sessionModel.findOne({
                refreshToken: refreshTokenHash,
                revoked: false
            });

            if (!session) {
                return res.status(401).json({
                    status: "failed",
                    message: "Invalid refresh token"
                });
            }

            const accessToken = jwt.sign(
                {
                    id: decoded.id
                },
                config.JWT_SECRET,
                {
                    expiresIn: "15m"
                }
            );

            const newRefreshToken = jwt.sign(
                {
                    id: decoded.id
                },
                config.JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

            session.refreshToken = newRefreshTokenHash;
            await session.save();

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
            })

            return res.status(200).json({
                status: "sucess",
                message: "access token refreshed successfully",
                accessToken
            });


        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error " + error,
            })
        }
    }

    static async getUser(req, res){
        try {
            const token = req.headers.authorization?.split(" ")[ 1 ];

            if (!token){
                return res.status(401).json({
                    status: "failed",
                    message: "token not found"
                })
            }

            const decoded = jwt.verify(token, config.JWT_SECRET);

            const user = await userModel.findById(decoded.id);
            const data = {
                username: user.username,
                email: user.email
            }

            return res.status(200).json({
                status: "successfull",
                message: "user fetech successfully",
                data: data
            })

        } catch (error) {
            
        }
    }

    static async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    status: "failed",
                    message: "refreshtoken not found"
                });
            }

            const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

            const session = await sessionModel.findOne({
                 refreshToken: refreshTokenHash,
                revoked: false
            });

            if (!session) {
                return res.status(401).json({
                    status: "failed",
                    message: "session not found"
                });
            }

            session.revoked = true;
            await session.save();

            res.clearCookie("refreshToken");

            return res.status(200).json({
                status: "success",
                message: "user logout successfully"
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Internal Server Error" + error
            })
        }
    }

    static async logoutAll(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    status: "failed",
                    message: "Refresh Token not found"
                });
            }

            const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

            await sessionModel.updateMany({
                user: decoded.id,
                revoked: false
            }, {
                revoked: true
            })


            res.clearCookie("refreshToken");

            return res.status(200).json({
                status: "success",
                message: "Logged out from all devices Successfully"
            })

        } catch (error) {
            return res.status(500).json({
                status: "Error",
                message: "internal Server Error: " + error
            });
        }
    }
}


export default AuthController;