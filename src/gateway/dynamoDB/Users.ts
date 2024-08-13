import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { User } from "../../entities/User";
import { buildUserFromRow, getUserStructure } from "../PlanetScale/Users";
import { dynamoDocumentClient, saveItem } from "./Utils";

export const saveDynamoUser = async (user: User): Promise<void> => {
  const userStructure = getUserStructure(user);
  return saveItem("UsersTable", userStructure);
};

export const getDynamoUserByPhoneNumber = async (
  recipientPhoneNumber: string,
): Promise<User | null> => {
  const query: QueryCommandInput = {
    TableName: "UsersTable",
    KeyConditionExpression: "#u = :recipient_phone_number",
    ExpressionAttributeNames: {
      "#u": "user",
    },
    ExpressionAttributeValues: {
      ":recipient_phone_number": recipientPhoneNumber,
    },
  };

  try {
    const { Items: items } = await dynamoDocumentClient.send(
      new QueryCommand(query),
    );

    console.log("USERS", items);
    if (!items || items.length === 0) {
      return null;
    }

    return buildUserFromRow(items[0]);
  } catch (error) {
    console.log("COULD_NOT_FIND_USER", error);
    return null;
  }
};
