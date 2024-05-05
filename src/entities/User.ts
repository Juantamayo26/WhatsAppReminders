import moment from "moment";

export class User {
  private id: string;
  private active: boolean;
  private createdAt: string;
  private threadId: string | null;
  private timeZone: string;

  public static loadUser(
    recipientPhoneNumber: string,
    active: boolean,
    createdAt: string,
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
    this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
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

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: string): void {
    this.createdAt = createdAt;
  }

  public getTimeZone(): string {
    return this.timeZone;
  }

  public setTimeZone(timeZone: string): void {
    this.timeZone = timeZone;
  }
}
