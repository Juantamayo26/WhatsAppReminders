import { User } from "../entities/User";
import { runCompletion } from "../entities/OpenAI";
import {
  generateWhatsAppText,
  getTranslationFromAudioId,
  sendWhatsAppMessage,
} from "../entities/WhatsApp";
import {
  getDynamoUserByPhoneNumber,
  saveDynamoUser,
} from "../gateway/dynamoDB/Users";

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
  audio?: WhatsAppAudioBody;
  type: string;
  errors?: WhatsAppError[];
}

export interface WhatsAppAudioBody {
  id: string;
  sha256: string;
  voice: boolean;
  mime_type: string;
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

  const { phoneNumberId: accountId } =
    payload.entry[0].changes[0].value.metadata;
  const { recipientPhoneNumber } =
    payload.entry[0].changes[0].value.contacts![0];
  const audioMessage = whatsAppMessage.audio;
  let textMessage = whatsAppMessage.text?.body;

  if (audioMessage) {
    console.log("PROCCESSING_AUDIO");
    textMessage = await getTranslationFromAudioId(audioMessage.id);
    console.log(`THE AUDIO IS: ${textMessage}`);
  }

  // TODO: get the timeZone by a chatgpt function
  const timeZone = "America/Bogota";

  let user = await getDynamoUserByPhoneNumber(recipientPhoneNumber);
  console.log(user);
  if (user === null) {
    user = new User(recipientPhoneNumber, timeZone);
    await saveDynamoUser(user);
  }

  const message = await runCompletion(user, textMessage!);
  if (message) {
    await sendWhatsAppMessage(
      accountId,
      generateWhatsAppText(message.getContent()!, recipientPhoneNumber),
    );
  }
};
