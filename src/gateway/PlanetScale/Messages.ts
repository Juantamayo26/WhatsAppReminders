import { Connection, RowDataPacket } from "mysql2/promise";
import { Message } from "../../entities/Messages";
import { saveStructures } from "./Utils";

export interface MessageDbStructure {
  id: string;
  role: string;
  content: string | undefined;
  created_at: string;
  user: string;
  tool_id: string | undefined;
  tool_call: string | undefined;
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
  const query = `SELECT * FROM messages WHERE user_id = ? ORDER BY created_at`;
  const [rows] = await connection.query<RowDataPacket[]>(query, [userId]);

  if (rows.length === 0) {
    return null;
  }

  return rows.map(buildMessageFromRow);
};

export const getMessageStructure = (message: Message): MessageDbStructure => {
  return {
    id: message.getId(),
    role: message.getRole(),
    content: message.getContent(),
    created_at: message.getCreatedAt().toISOString(),
    user: message.getUserId(),
    tool_id: message.getToolId(),
    tool_call: JSON.stringify(message.getToolCall()),
  };
};

export const buildMessageFromRow = (row: any): Message => {
  return Message.loadMessage(
    row.id,
    row.role,
    row.content,
    new Date(row.created_at),
    row.user,
    row.tool_id,
    row.tool_call,
  );
};
