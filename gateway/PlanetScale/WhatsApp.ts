import { Connection } from "mysql2/promise";
import { Reminder } from "../../src/entities/Reminder";

export interface ReminderDbStructure {
  id: string;
  user: string;
  reminder_at: string;
  created_at: string;
  message: string;
  done: boolean;
  every: string | null;
}

export const saveReminder = async (
  reminder: Reminder,
  connection: Connection,
): Promise<void> => {
  const reminderStructure = getReminderStructure(reminder);
  const columns = Object.keys(reminderStructure)
    .map((key) => {
      return `${key}`;
    })
    .join(",");
  const query = `INSERT INTO reminders (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = Object.keys(reminderStructure).map((key) => {
    return (reminderStructure as any)[key];
  });

  await connection.query(query, values);
};

const getReminderStructure = (reminder: Reminder): ReminderDbStructure => {
  return {
    id: reminder.getId(),
    user: reminder.getUser(),
    reminder_at: reminder.getReminderAt(),
    created_at: reminder.getCreatedAt(),
    message: reminder.getMessage(),
    done: reminder.isDone(),
    every: null,
  };
};
