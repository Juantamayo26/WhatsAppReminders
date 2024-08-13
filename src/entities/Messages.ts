import moment from "moment";
import { ChatCompletionMessageToolCall } from "openai/resources";
import { v4 as uuid } from "uuid";

type RoleType = "system" | "user" | "assistant" | "tool";

export class Message {
  private id: string;
  private role: RoleType;
  private content: string | undefined;
  private createdAt: Date;
  private userId: string;
  private wasUpdated: boolean;
  private toolId: string | undefined;
  private toolCall: ChatCompletionMessageToolCall | undefined;

  public static loadMessage(
    id: string,
    role: RoleType,
    content: string,
    createdAt: Date,
    userId: string,
    toolId?: string,
    toolCall?: ChatCompletionMessageToolCall,
  ): Message {
    const message = new Message(role, content, userId, toolId, toolCall);
    message.setId(id);
    message.setCreatedAt(createdAt);
    return message;
  }

  constructor(
    role: RoleType,
    content: string | undefined,
    userId: string,
    toolId?: string,
    toolCall?: ChatCompletionMessageToolCall,
  ) {
    this.id = uuid();
    this.role = role;
    this.content = content;
    this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
    this.userId = userId;
    this.wasUpdated = true;
    this.toolId = toolId;
    this.toolCall = toolCall;
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

  public getContent(): string | undefined {
    return this.content;
  }

  public setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getToolId(): string | undefined {
    return this.toolId;
  }

  public getToolCall(): ChatCompletionMessageToolCall | undefined {
    return this.toolCall;
  }
}
