import { type Request } from "express";
import {
  type WhatsAppChange,
  type WhatsAppContact,
  type WhatsAppEntry,
  type WhatsAppError,
  type WhatsAppMessage,
  type WhatsAppStatus,
  type WhatsAppWebhook,
} from "../../interactors/WhatsAppWebhook";

export const buildWhatsAppWebHookPayload = (
  data: Request["body"],
): WhatsAppWebhook => {
  return {
    object: data.object,
    entry: data.entry.map(buildWhatsAppEntry),
  };
};

const buildWhatsAppEntry = (entry: any): WhatsAppEntry => {
  return {
    id: entry.id,
    changes: entry.changes.map(buildWhatsAppChanges),
  };
};

const buildWhatsAppChanges = (change: any): WhatsAppChange => {
  return {
    field: change.field,
    value: {
      messagingProduct: change.value.messaging_product,
      metadata: {
        displayPhoneNumber: change.value.metadata.display_phone_number,
        phoneNumberId: change.value.metadata.phone_number_id,
      },
      contacts: change.value.contacts
        ? change.value.contacts.map(buildWhatsAppContact)
        : undefined,
      errors: change.value?.errors
        ? change.value.errors.map(buildWhatsAppErrors)
        : undefined,
      statuses: change.value.statuses
        ? change.value.statuses.map(buildWhatsAppStatus)
        : undefined,
      messages: change.value?.messages
        ? change.value.messages.map(buildWhatsAppMessage)
        : undefined,
    },
  };
};

export const buildWhatsAppMessage = (message: any): WhatsAppMessage => {
  if (message.image) {
    const { caption, mime_type, sha256, id } = message.image;
    message.image = {
      caption,
      mimeType: mime_type,
      sha256,
      id,
    };
  }
  return message;
};

const buildWhatsAppStatus = (status: any): WhatsAppStatus => {
  return {
    id: status.id,
    status: status.status,
    timestamp: status.timestamp,
    recipientId: status.recipient_id,
    errors: status?.errors,
  };
};

const buildWhatsAppContact = (contact: any): WhatsAppContact => {
  return {
    recipientPhoneNumber: contact.wa_id,
    profileName: contact.profile.name,
  };
};

const buildWhatsAppErrors = (error: any): WhatsAppError => {
  return {
    code: error.code,
    title: error.title,
    message: error.message,
    errorData: error.error_data,
  };
};
