import { type NextFunction, type Request, type Response } from "express";
import {
  type WhatsAppWebhook,
  sendMessageWebhook,
} from "../../interactors/WhatsAppWebhook";
import { validation } from "../utils/Validator";
import { notificationWhatsAppWebhookValidator } from "../utils/Validations";
import { buildWhatsAppWebHookPayload } from "./WhatsAppPayloadCreation";

export const getNotificationWebhookController = [
  ...notificationWhatsAppWebhookValidator,
  validation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const whatsAppPayload = buildWhatsAppWebHookPayload(req.body);
      const { client_id: clientId } = req.params;
      // const errors = whatsAppPayload.entry[0].changes[0].value.errors
      // if (errors && errors.length > 0) {
      //   log.error(
      //     "WHATSAPP_MESSAGES_WEBHOOK_ERROR",
      //     whatsAppPayload,
      //     new GambitError(errors[0].title, "WHATSAPP_WEBHOOK_ERROR", errors[0].code)
      //   );
      // }

      if (shouldSendMessage(whatsAppPayload)) {
        await sendMessageWebhook(whatsAppPayload, clientId);
      }
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  },
];

const shouldSendMessage = (whatsAppPayload: WhatsAppWebhook): boolean => {
  const whatsAppMessageType =
    whatsAppPayload.entry[0].changes[0].value.messages![0].type;
  const validMessageTypes = ["text"];
  return validMessageTypes.includes(whatsAppMessageType);
};
