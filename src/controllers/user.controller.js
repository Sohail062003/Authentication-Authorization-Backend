import jwt from "jsonwebtoken"
import config from "../config/config.js";
import userModel from "../models/user.model.js";

class UserController {

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
                return res.status(404).json({
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

}

export default UserController 
