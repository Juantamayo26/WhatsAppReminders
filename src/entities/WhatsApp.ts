import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WHATSAPP_URL = "https://graph.facebook.com/v17.0";
const whatsappToken = process.env.WHATSAPP_TOKEN;

export enum WhatsAppParameterType {
  TEXT = "text",
}

enum WhatsAppType {
  TEMPLATE = "template",
  IMAGE = "image",
  TEXT = "text",
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components?: WhatsAppComponent[];
}

interface WhatsAppComponent {
  type: "header" | "body" | "button";
  parameters: WhatsAppParameter[];
}

interface WhatsAppTextParameter {
  type: WhatsAppParameterType.TEXT;
  text: string;
}

type WhatsAppParameter = WhatsAppTextParameter;

export interface WhatsAppRequestBody {
  messaging_product: string;
  to: string;
  type: WhatsAppType;
  template?: WhatsAppRequestTemplate;
  image?: WhatsAppRequestImage;
  text?: WhatsAppText;
}

export interface WhatsAppRequestTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: WhatsAppComponent[];
}

export interface WhatsAppRequestImage {
  link: string;
}

export interface WhatsAppText {
  preview_url: boolean;
  body: string;
}

export interface WhatsAppResponse {
  messaging_product: string;
  messages: Message[];
}

interface Message {
  id: string;
}

export const sendWhatsAppMessage = async (
  whatsAppPhoneNumber: string,
  whatsAppMessage: WhatsAppRequestBody,
): Promise<string[]> => {
  console.log(`${WHATSAPP_URL}/${whatsAppPhoneNumber}/messages`);
  console.log(whatsAppMessage);
  const { data } = await axios.post<WhatsAppResponse>(
    `${WHATSAPP_URL}/${whatsAppPhoneNumber}/messages`,
    { body: whatsAppMessage },
    {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  console.log(data);

  const messageIds = data.messages.map((message) => {
    return message.id;
  });

  return messageIds;
};

export const generateWhatsAppText = (
  text: string,
  to: string,
): WhatsAppRequestBody => {
  return {
    messaging_product: "whatsapp",
    to,
    type: WhatsAppType.TEXT,
    text: {
      preview_url: false,
      body: text,
    },
  };
};

export const generateWhatsAppTemplateMessage = (
  params: WhatsAppTemplate,
  to: string,
): WhatsAppRequestBody => {
  const { name, language, components } = params;
  return {
    messaging_product: "whatsapp",
    to,
    type: WhatsAppType.TEMPLATE,
    template: {
      name,
      language: {
        code: language,
      },
      components,
    },
  };
};

export const generateWhatsAppImageMessage = (
  url: string,
  to: string,
): WhatsAppRequestBody => {
  return {
    messaging_product: "whatsapp",
    to,
    type: WhatsAppType.IMAGE,
    image: {
      link: url,
    },
  };
};
