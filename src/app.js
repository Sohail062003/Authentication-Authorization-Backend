import express from "express";
import morgan from "morgan";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";

const app = express();


app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/v1", routes);





export default app;