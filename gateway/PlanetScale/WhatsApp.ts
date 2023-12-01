import { Pool } from "mysql2/promise";
import { Reminder } from "../../src/entities/Reminder";

export interface ReminderDbStructure {
  id: string;
  user: string;
  reminder_at: Date;
  created_at: Date;
  message: string;
  done: boolean;
  every: string | null;
}

export const saveReminder = async (
  reminder: Reminder,
  pool: Pool,
): Promise<void> => {
  const reminderStructure = getReminderStructure(reminder);
  const query = `
    INSERT INTO reminders (id, created_at, reminder_at, message, user, every, done)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = Object.keys(reminderStructure).map((key) => {
    return (reminderStructure as any)[key];
  });

  await pool.query(query, values);
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
