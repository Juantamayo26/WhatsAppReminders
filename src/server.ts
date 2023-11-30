import express from "express";
import router from "./controllers/index";

const app = express();
const port = 3000;

app.disable("x-powered-by");

app.use("/", router);

export default app;
