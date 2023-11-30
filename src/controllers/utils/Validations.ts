import { body, param, type ValidationChain } from "express-validator";
import { WebhookStatus } from "../../interactors/WhatsAppWebhook";

const whatsAppMesageValidation = (propertyName: string): ValidationChain[] => {
  return [
    body(`${propertyName}.*.from`).exists().isString(),
    body(`${propertyName}.*.id`).exists().isString(),
    body(`${propertyName}.*.timestamp`).exists().isString(),
    body(`${propertyName}.*.type`).exists().isString(),
    body(`${propertyName}.*.text`).optional().isObject(),
    body(`${propertyName}.*.text.body`).optional().isString(),
    body(`${propertyName}.*.image`).optional().isObject(),
    body(`${propertyName}.*.image.caption`).optional().isString(),
    body(`${propertyName}.*.image.mime_type`).optional().isString(),
    body(`${propertyName}.*.image.sha256`).optional().isString(),
    body(`${propertyName}.*.image.id`).optional().isString(),
    ...whatsAppErrorsValidation(`${propertyName}.*.errors`),
  ];
};

const whatsAppStatusValidation = (propertyName: string): ValidationChain[] => {
  return [
    body(`${propertyName}.*.id`).exists().isString(),
    body(`${propertyName}.*.status`)
      .exists()
      .isString()
      .isIn(Object.values(WebhookStatus)),
    body(`${propertyName}.*.timestamp`).exists().isString(),
    ...whatsAppErrorsValidation(`${propertyName}.*.errors`),
  ];
};

const whatsAppValueValidation = (propertyName: string): ValidationChain[] => {
  return [
    body(`${propertyName}`).exists().isObject(),
    body(`${propertyName}.metadata`).exists().isObject(),
    body(`${propertyName}.metadata.display_phone_number`).exists().isString(),
    body(`${propertyName}.metadata.phone_number_id`)
      .exists()
      .exists()
      .isString(),
    body(`${propertyName}.contacts`).optional().isArray(),
    body(`${propertyName}.contacts`)
      .if(body(`${propertyName}.statuses`).exists())
      .not()
      .exists(),
    body(`${propertyName}.contacts`)
      .if(body(`${propertyName}.messages`).exists())
      .exists(),
    body(`${propertyName}.contacts.*.wa_id`).exists().isString(),
    body(`${propertyName}.contacts.*.profile`).exists().exists(),
    body(`${propertyName}.contacts.*.profile.name`).exists().exists(),
    body(`${propertyName}.statuses`).optional().isArray(),
    body(`${propertyName}.messages`).optional().isArray(),
    body(`${propertyName}.statuses`)
      .if(body(`${propertyName}.messages`).exists())
      .not()
      .exists(),
    body(`${propertyName}.messages`)
      .if(body(`${propertyName}.statuses`).exists())
      .not()
      .exists(),
    ...whatsAppStatusValidation(`${propertyName}.statuses`),
    ...whatsAppMesageValidation(`${propertyName}.messages`),
    ...whatsAppErrorsValidation(`${propertyName}.errors`),
  ];
};

const whatsAppChangeValidation = (propertyName: string): ValidationChain[] => {
  return [
    body(propertyName).isArray().exists(),
    body(`${propertyName}.*.field`).exists().isString(),
    body(`${propertyName}.*.value`).exists().isObject(),
    ...whatsAppValueValidation(`${propertyName}.*.value`),
  ];
};

const whatsAppErrorsValidation = (propertyName: string): ValidationChain[] => {
  return [
    body(propertyName).isArray().optional(),
    body(`${propertyName}.*.code`)
      .if(body(propertyName).exists())
      .exists()
      .isInt(),
    body(`${propertyName}.*.title`)
      .if(body(propertyName).exists())
      .exists()
      .isString(),
    body(`${propertyName}.*.message`)
      .if(body(propertyName).exists())
      .exists()
      .isString(),
    body(`${propertyName}.*.error_data`)
      .if(body(propertyName).exists())
      .exists()
      .isObject(),
    body(`${propertyName}.*.error_data.details`)
      .if(body(propertyName).exists())
      .exists()
      .isString(),
  ];
};

export const notificationWhatsAppWebhookValidator: ValidationChain[] = [
  param("client_id").exists().isString(),
  body("object").exists().isString(),
  body("entry").exists().isArray().isLength({ min: 1 }),
  body("entry.*.id").exists().isString(),
  ...whatsAppChangeValidation("entry.*.changes"),
];
