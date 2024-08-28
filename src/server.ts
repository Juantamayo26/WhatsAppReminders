import express from "express";
import router from "./controllers/index";
import { sendInfoLog } from "./entities/TelegramLogger";

const app = express();
const port = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use("/", router);

app.listen(port, () => {
  sendInfoLog("LISTENING_ON_PORT", { port }).catch();
  console.log(`LISTENING_ON_PORT_${port}`);
});
