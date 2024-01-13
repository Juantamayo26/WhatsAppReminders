import { Connection } from "mysql2/promise";
import { Reminder } from "../../entities/Reminder";
import { saveStructures } from "./Utils";

export interface ReminderDbStructure {
  id: string;
  user: string;
  reminder_at: string;
  created_at: string;
  message: string;
  done: boolean;
  recurrence?: string;
}

export const saveReminder = async (
  reminder: Reminder,
  connection: Connection,
): Promise<void> => {
  const reminderStructure = getReminderStructure(reminder);
  return saveStructures([reminderStructure], "reminders", connection);
};

const getReminderStructure = (reminder: Reminder): ReminderDbStructure => {
  return {
    id: reminder.getId(),
    user: reminder.getUser(),
    reminder_at: reminder.getReminderAt(),
    created_at: reminder.getCreatedAt(),
    message: reminder.getMessage(),
    done: reminder.isDone(),
    recurrence: JSON.stringify(reminder.getRecurrence()),
  };
};
