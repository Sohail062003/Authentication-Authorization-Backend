import mongoose from "mongoose";
import config from "./config.js";


async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to mongoDB: ", error);
    }
}


export default connectDB;