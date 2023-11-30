import express, { type Response, type Request } from "express";
import WhatsAppWebHook from "./routes/WhatsApp";

const router = express.Router();

const healthCheck = (_: Request, res: Response): void => {
  res.status(200).json({ status: "Reminders is healthy" });
};

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.get("/", healthCheck);
router.use("/whatsapp", WhatsAppWebHook);

export default router;
