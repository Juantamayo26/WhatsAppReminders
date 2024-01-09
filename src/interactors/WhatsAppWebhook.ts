import { Connection } from "mysql2/promise";
import { onSession } from "../gateway/PlanetScale/Basics";
import { User } from "../entities/User";
import { getUserByPhoneNumber, saveUser } from "../gateway/PlanetScale/Users";
import { runCompletion } from "../entities/OpenAI";
import {
  generateWhatsAppText,
  sendWhatsAppMessage,
} from "../entities/WhatsApp";

export interface WhatsAppWebhook {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  field: string;
  value: WhatsAppValue;
}

export interface WhatsAppValue {
  messagingProduct: string;
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  errors?: WhatsAppError[];
  statuses?: WhatsAppStatus[];
  messages?: WhatsAppMessage[];
}

export interface WhatsAppContact {
  recipientPhoneNumber: string;
  profileName: string;
}

interface WhatsAppMetadata {
  displayPhoneNumber: string;
  phoneNumberId: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text?: { body: string };
  image?: WhatsAppImageBody;
  type: string;
  errors?: WhatsAppError[];
}

export interface WhatsAppStatus {
  id: string;
  status: WebhookStatus;
  timestamp: string;
  recipientId: string;
  errors?: WhatsAppError[];
}

export interface WhatsAppError {
  code: number;
  title: string;
  message: string;
  errorData: {
    details: string;
  };
}

export interface WhatsAppImageBody {
  caption?: string;
  mimeType: string;
  sha256: string;
  id: string;
}

export enum WebhookStatus {
  DISPACHED = "dispatched",
  FAILED = "failed",
  DELIVERED = "delivered",
  READ = "read",
  SENT = "sent",
}

export const sendMessageWebhook = async (
  payload: WhatsAppWebhook,
): Promise<void> => {
  await Promise.resolve();
  const whatsAppMessage = payload.entry[0].changes[0].value.messages![0];
  if (!whatsAppMessage) {
    return;
  }

  const errors = whatsAppMessage.errors;
  if (errors && errors.length > 0) {
    //   log.error(
    //     "WHATSAPP_MESSAGES_WEBHOOK_ERROR",
    //     payload,
    //     new GambitError(errors[0].title, "WHATSAPP_MESSAGES_WEBHOOK_ERROR", errors[0].code)
    //   );
    return;
  }

  const textMessage = whatsAppMessage.text?.body!;
  const imageMessage = whatsAppMessage.image;

  const { phoneNumberId: accountId } =
    payload.entry[0].changes[0].value.metadata;
  const { recipientPhoneNumber } =
    payload.entry[0].changes[0].value.contacts![0];

  await onSession(async (connection: Connection) => {
    // TODO: get the timeZone by a chatgpt function
    const timeZone = "America/Bogota";

    let user = await getUserByPhoneNumber(recipientPhoneNumber, connection);
    if (user === null) {
      user = new User(recipientPhoneNumber, timeZone);
      await saveUser(user, connection);
    }

    if (imageMessage) {
      console.log("THIS IS A IMAGE");
    } else {
      const message = await runCompletion(user, textMessage, connection);
      if (message) {
        await sendWhatsAppMessage(
          accountId,
          generateWhatsAppText(message.getContent(), recipientPhoneNumber),
        );
      }
    }
  });
};
