import express from "express";
import router from "./controllers/index";

const app = express();
app.disable("x-powered-by");

app.use("/", router);
