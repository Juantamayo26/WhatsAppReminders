import { Connection, RowDataPacket } from "mysql2/promise";
import { Message } from "../../entities/Messages";
import { saveStructures } from "./Utils";

export interface MessageDbStructure {
  id: string;
  role: string;
  content: string;
  created_at: string;
  user_id: string;
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

export const getMessagesByUserId = async (
  userId: string,
  connection: Connection,
) => {
  const query = `SELECT * FROM messages WHERE user_id = ?`;
  const [rows] = await connection.query<RowDataPacket[]>(query, [userId]);

  if (rows.length === 0) {
    return null;
  }

  return rows.map(buildMessageFromRow);
};

const getMessageStructure = (message: Message): MessageDbStructure => {
  return {
    id: message.getId(),
    role: message.getRole(),
    content: message.getContent(),
    created_at: message.getCreatedAt(),
    user_id: message.getUserId(),
  };
};

const buildMessageFromRow = (row: any): Message => {
  return Message.loadMessage(
    row.id,
    row.role,
    row.content,
    row.created_at,
    row.user_id,
  );
};
