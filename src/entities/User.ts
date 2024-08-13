import moment from "moment";

export class User {
  private id: string;
  private active: boolean;
  private createdAt: Date;
  private threadId: string | null;
  private timeZone: string;

  public static loadUser(
    recipientPhoneNumber: string,
    active: boolean,
    createdAt: Date,
    threadId: string | null,
    timeZone: string,
  ): User {
    const user = new User(recipientPhoneNumber, timeZone);
    user.setActive(active);
    user.setCreatedAt(createdAt);
    user.setThreadId(threadId);
    return user;
  }

  constructor(recipientPhoneNumber: string, timeZone: string) {
    this.id = recipientPhoneNumber;
    this.active = true;
    this.createdAt = moment().utc();
    this.threadId = null;
    this.timeZone = timeZone;
  }

  public getId(): string {
    return this.id;
  }

  public setId(id: string) {
    this.id = id;
  }

  public getActive(): boolean {
    return this.active;
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public getThreadId(): string | null {
    return this.threadId;
  }

  public setThreadId(threadId: string | null): void {
    this.threadId = threadId;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }

  public getTimeZone(): string {
    return this.timeZone;
  }

  public setTimeZone(timeZone: string): void {
    this.timeZone = timeZone;
  }
}
