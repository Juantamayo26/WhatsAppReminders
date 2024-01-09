import moment from "moment";
import { v4 as uuid } from "uuid";

export class Message {
  private id: string;
  private role: string;
  private content: string;
  private createdAt: string;
  private userId: string;
  private wasUpdated: boolean;

  public static loadMessage(
    id: string,
    role: string,
    content: string,
    createdAt: string,
    userId: string,
  ): Message {
    const message = new Message(role, content, userId);
    message.setId(id);
    message.setCreatedAt(createdAt);
    return message;
  }

  constructor(role: string, content: string, userId: string) {
    this.id = uuid();
    this.role = role;
    this.content = content;
    this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
    this.userId = userId;
    this.wasUpdated = true;
  }

  public setId(id: string) {
    this.setWasUpdated(true);
    this.id = id;
  }

  public setWasUpdated(wasUpdated: boolean) {
    this.wasUpdated = wasUpdated;
  }

  public shouldBeSaved(): boolean {
    return this.wasUpdated;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getId(): string {
    return this.id;
  }

  public getRole(): string {
    return this.role;
  }

  public getContent(): string {
    return this.content;
  }

  public setCreatedAt(createdAt: string): void {
    this.createdAt = createdAt;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }
}
