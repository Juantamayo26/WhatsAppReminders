import express from "express";
import router from "./controllers/index";

const app = express();
const port = process.env.PORT || 3000;

app.disable("x-powered-by");

app.use("/", router);

app.listen(port, () => {
  console.log(`LISTENING_ON_PORT_${port}`);
});
