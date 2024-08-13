import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Reminder } from "../../entities/Reminder";
import dynamoDBParameters from "./DynamoDBParameters";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: true,
};

const unmarshallOptions = {
  wrapNumbers: false,
};

const translateConfig = { marshallOptions, unmarshallOptions };
const dynamoClient = new DynamoDBClient(dynamoDBParameters);
export const dynamoDocumentClient = DynamoDBDocumentClient.from(
  dynamoClient,
  translateConfig,
);

export const saveReminderDynamo = async (reminder: Reminder | undefined): Promise<void> => {
  if (!reminder) {
    return;
  }

  const reminderItem = {
    id: { S: reminder.getId() },
    user: { S: reminder.getUser() },
    reminderAt: { S: reminder.getReminderAt().toISOString() },
    createdAt: { S: reminder.getCreatedAt().toISOString() },
    message: { S: reminder.getMessage() },
    done: { BOOL: reminder.isDone() },
    recurrence: { S: JSON.stringify(reminder.getRecurrence()) },
  };

  const putItemCommand = new PutItemCommand({
    TableName: "RemindersTable",
    Item: reminderItem,
  });

  try {
    await dynamoClient.send(putItemCommand);
  } catch (error) {
    console.error("Error saving reminder to DynamoDB:", error);
    throw error;
  }
};
