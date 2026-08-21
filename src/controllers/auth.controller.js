import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";

class AuthController {

    // register 
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

    // login
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

    // refreshToken 
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

    // getUser by token 
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

    // offset based pagination - page and limit
    static async getAllUser(req, res){
        try {

            const page = Number(req.query.page) || 1;           // its come in string so we need to convert it into number
            const limit = Number(req.query.limit) || 3;         

            const skip = (page - 1) * limit;  // (1 - 1) * 3 = 0, (2-1) * 3 = 3, 

            const user = await userModel
                .find().select("-password -__v")
                .skip(skip)
                .sort({ createdAt: -1 })
                .limit(limit);
            
            if (user.length === 0) {
                return res.status(400).json({
                    status: "falied",
                    message: "user not found" 
                });
            }

            const totalUsers = await userModel.countDocuments();

            const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 0;
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            const pagination = {
                currentPage: page,
                totalUsers,
                totalPages,
                hasNextPage,
                hasPreviousPage
            }

            return res.status(200).json({
                status: "success",
                message: "user found successfully",
                data: user,
                pagination: pagination
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Internal server error "+ error
            })
        }
    }

    // if cursor 
    static async getAllUserByCursor(req, res) {
        try {
            const limit = Number(req.query.limit);
            const cursor = req.query.cursor;

            let query = {}

            if (cursor) {
                query._id = { $lt: cursor };
            }

            const users = await userModel
                    .find( query )
                    .sort({ _id: -1 }) // newest element
                    .limit(limit)

            if (users.length === 0) {
                return res.status(400).json({
                    status: "failed",
                    message: "user not found"
                });
            }

            const nextCursor = 
                users.length > 0 
                ? users[users.length - 1]._id 
                : null;

            return res.status(200).json({
                status: "sucess",
                message: "",
                data: {
                    users,
                    pagination: {
                        limit,
                        cursor: nextCursor  
                    }
                }
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: "Internal server error :" + error
            })
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