import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Reminder } from "../../entities/Reminder";

const dynamoClient = new DynamoDBClient({});

export const saveReminderDynamo = async (reminder: Reminder | undefined): Promise<void> => {
  if (!reminder) {
    return;
  }

  const reminderItem = {
    id: { S: reminder.getId() },
    user: { S: reminder.getUser() },
    reminderAt: { S: reminder.getReminderAt() },
    createdAt: { S: reminder.getCreatedAt() },
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