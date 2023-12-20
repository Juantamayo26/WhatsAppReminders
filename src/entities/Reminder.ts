import moment, { Moment } from "moment";
import { v4 as uuid } from "uuid";

export class Reminder {
  public static loadReminder(
    id: string,
    user: string,
    reminderAt: string,
    createdAt: string,
    message: string,
    isDone: boolean,
  ): Reminder {
    const reminder = new Reminder(user, moment.utc(reminderAt), message);
    reminder.createdAt = createdAt;
    reminder.setId(id);
    reminder.setDone(isDone);
    return reminder;
  }

  constructor(user: string, reminderAt: Moment, message: string) {
    this.id = uuid();
    this.reminderAt = reminderAt.format("YYYY-MM-DD HH:mm:ss.SSS");
    this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
    this.message = message;
    this.user = user;
    this.done = false;
  }

  private id: string;
  private createdAt: string;
  private reminderAt: string;
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

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public getReminderAt(): string {
    return this.reminderAt;
  }

  public getMessage(): string {
    return this.message;
  }

  public getUser(): string {
    return this.user;
  }
}
