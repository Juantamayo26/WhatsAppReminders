import { Connection } from "mysql2/promise";
import { onSession } from "../../gateway/PlanetScale/Basics";
import { Reminder } from "../entities/Reminder";
import moment from "moment";
import { saveReminder } from "../../gateway/PlanetScale/WhatsApp";

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
  clientId: string,
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

  // const { phoneNumberId: accountId } = payload.entry[0].changes[0].value.metadata;
  // const { recipientPhoneNumber } = payload.entry[0].changes[0].value.contacts![0];

  if (imageMessage) {
    console.log("THIS IS A IMAGE");
  } else {
    await saveRemin(textMessage);
  }
};

const saveRemin = async (message: string): Promise<void> => {
  await onSession(async (connection: Connection) => {
    const reminder = new Reminder("JUAN_TAMAYO", moment.utc(), message);
    return saveReminder(reminder, connection);
  });
};
