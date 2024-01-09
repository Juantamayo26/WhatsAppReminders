import moment from "moment";
import { v4 as uuid } from "uuid";

type RoleType = "system" | "user" | "assistant" | "tool";

export class Message {
  private id: string;
  private role: RoleType;
  private content: string;
  private createdAt: string;
  private userId: string;
  private wasUpdated: boolean;
  private toolId: string | undefined;

  public static loadMessage(
    id: string,
    role: RoleType,
    content: string,
    createdAt: string,
    userId: string,
    toolId: string | undefined,
  ): Message {
    const message = new Message(role, content, userId, toolId);
    message.setId(id);
    message.setCreatedAt(createdAt);
    return message;
  }

  constructor(
    role: RoleType,
    content: string,
    userId: string,
    toolId?: string,
  ) {
    this.id = uuid();
    this.role = role;
    this.content = content;
    this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
    this.userId = userId;
    this.wasUpdated = true;
    this.toolId = toolId;
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

  public getRole(): RoleType {
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

  public getToolId(): string | undefined {
    return this.toolId;
  }
}
