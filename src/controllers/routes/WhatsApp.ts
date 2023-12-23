import express from "express";
import { getNotificationWebhookController } from "../whatsApp/NotificationWebhookController";
import { subscribeWhatsAppWebHookController } from "../whatsApp/WebHook";

const router = express.Router();

router.get("/webhook", subscribeWhatsAppWebHookController);
router.post("/webhook", getNotificationWebhookController);

export default router;
