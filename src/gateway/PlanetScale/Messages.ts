import { Connection } from "mysql2/promise";
import { Message } from "../../entities/Messages";
import { saveStructures } from "./Utils";

export interface MessageDbStructure {
  id: string;
  role: string;
  content: string;
  created_at: string;
  userId: string;
}

export const saveMessages = async (
  messages: Message[],
  connection: Connection,
): Promise<void> => {
  const messageStructures = messages
    .filter((message) => message.shouldBeSaved())
    .map(getMessageStructure);
  return saveStructures(messageStructures, "messages", connection);
};

const getMessageStructure = (message: Message): MessageDbStructure => {
  return {
    id: message.getId(),
    role: message.getRole(),
    content: message.getContent(),
    created_at: message.getCreatedAt(),
    userId: message.getUserId(),
  };
};
