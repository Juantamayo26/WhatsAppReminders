import { QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
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

export const getDynamoMessagesByUserId = async (userId: string) => {
  const query: QueryCommandInput = {
    TableName: "MessagesTable",
    IndexName: "messages-user-sort",
    KeyConditionExpression: "#user = :recipient_phone_number",
    ExpressionAttributeNames: {
      "#user": "user"
    },
    ExpressionAttributeValues: {
      ":recipient_phone_number": { S: userId },
    },
    ScanIndexForward: true,
  };

  try {
    console.log("DynamoDB Query:", JSON.stringify(query, null, 2));

    const { Items: items } = await dynamoDocumentClient.send(
      new QueryCommand(query),
    );

    if (!items) {
      return null;
    }
    console.log("Items:", items);

    return items.map(buildMessageFromRow);
  } catch (error) {
    console.log("COULD_NOT_FIND_MESSAGES_BY_USER", error);
    return null;
  }
};
