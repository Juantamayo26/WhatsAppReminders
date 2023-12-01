import moment from "moment";
import { v4 as uuid } from "uuid";

export class Reminder {
  public static loadReminder(
    id: string,
    user: string,
    reminderAt: Date,
    createdAt: Date,
    message: string,
    isDone: boolean,
  ): Reminder {
    const reminder = new Reminder(user, reminderAt, message);
    reminder.createdAt = createdAt;
    reminder.setId(id);
    reminder.setDone(isDone);
    return reminder;
  }

  constructor(user: string, reminderAt: Date, message: string) {
    this.id = uuid();
    this.reminderAt = reminderAt;
    this.createdAt = moment().utc().toDate();
    this.message = message;
    this.user = user;
    this.done = false;
  }

  private id: string;
  private createdAt: Date;
  private reminderAt: Date;
  private message: string;
  private user: string;
  private done: boolean;

  public getId(): string {
    return this.id;
  }

  public setId(id: string) {
    this.id = id;
  }

  public setDone(isDone: boolean): void {
    this.done = isDone;
  }

  public isDone(): boolean {
    return this.done;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getReminderAt(): Date {
    return this.reminderAt;
  }

  public getMessage(): string {
    return this.message;
  }

  public getUser(): string {
    return this.user;
  }
}
