import dotenv from "dotenv";

dotenv.config();  

if (!process.env.MONGODB_URI){
    throw new Error("MONGODB_URI is not defined in the environment variables");
}

if (!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

const config = {
    PORT: process.env.PORT || 3000,
    MONGO_URL: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET
}

export default config;