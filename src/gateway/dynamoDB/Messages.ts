import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { Message } from "../../entities/Messages";
import {
  buildMessageFromRow,
  getMessageStructure,
} from "../PlanetScale/Messages";
import { dynamoDocumentClient, saveItems } from "./Utils";

export const saveDynamoMessages = async (
  messages: Message[],
): Promise<void> => {
  const messageStructures = messages
    .filter((message) => message.shouldBeSaved())
    .map(getMessageStructure);
  return saveItems("MessagesTable", messageStructures);
};

export const getDynamoMessagesByUserId = async (
  userId: string,
): Promise<Message[] | null> => {
  const query: QueryCommandInput = {
    TableName: "MessagesTable",
    IndexName: "messages-user-sort",
    KeyConditionExpression: "#u = :user_id",
    ExpressionAttributeNames: {
      "#u": "user",
    },
    ExpressionAttributeValues: {
      ":user_id": userId,
    },
    ScanIndexForward: true,
  };

  try {
    const { Items: items } = await dynamoDocumentClient.send(
      new QueryCommand(query),
    );

    console.log("items", items);

    if (!items) {
      return null;
    }

    return items.map(buildMessageFromRow);
  } catch (error) {
    console.error("COULD_NOT_FIND_MESSAGES_BY_USER", error);
    return null;
  }
};
