import express from "express";
import { getNotificationWebhookController } from "../whatsApp/NotificationWebhookController";
import { subscribeWhatsAppWebHookController } from "../whatsApp/WebHook";

const router = express.Router();

router.get("/:client_id/webhook", subscribeWhatsAppWebHookController);
router.post("/:client_id/webhook", getNotificationWebhookController);

export default router;
