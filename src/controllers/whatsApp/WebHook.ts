import { type Request, type Response } from "express";
import { query } from "express-validator";
import { validation } from "../utils/Validator";

export const subscribeWhatsAppWebHookController = [
  query("hub.verify_token").exists().isString(),
  query("hub.mode").exists().isString(),
  query("hub.challenge").exists().isString(),
  validation,
  (req: Request, res: Response) => {
    const {
      "hub.verify_token": token,
      "hub.mode": mode,
      "hub.challenge": challenge,
    } = req.query;
    // const verifyToken = config.get("whatsapp_verify_token");
    const verifyToken = "HOLA";

    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(401);
    }
  },
];
