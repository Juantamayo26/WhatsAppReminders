import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { Reminder } from "../../entities/Reminder";
import { dynamoDocumentClient } from "./Utils";

export const saveReminderDynamo = async (
  reminder: Reminder | undefined,
): Promise<void> => {
  if (!reminder) {
    return;
  }

  const putItemCommand = new PutCommand({
    TableName: "RemindersTable",
    Item: {
      id: reminder.getId(),
      user: reminder.getUser(),
      reminder_at: reminder.getReminderAt().toISOString(),
      created_at: reminder.getCreatedAt().toISOString(),
      message: reminder.getMessage(),
      done: reminder.isDone(),
      recurrence: reminder.getRecurrence(),
    },
  });

  try {
    await dynamoDocumentClient.send(putItemCommand);
  } catch (error) {
    console.error("Error saving reminder to DynamoDB:", error);
    throw error;
  }
};
