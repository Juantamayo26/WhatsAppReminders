import moment from "moment";
import { v4 as uuid } from "uuid";

export class User {
  private id: string;
  private recipientPhoneNumber: string;
  private active: boolean;
  private createdAt: string;

  public static loadUser(
    id: string,
    recipientPhoneNumber: string,
    active: boolean,
    createdAt: string,
  ): User {
    const user = new User(recipientPhoneNumber);
    user.setId(id);
    user.setActive(active);
    user.setCreatedAt(createdAt);
    return user;
  }

  constructor(recipientPhoneNumber: string) {
    this.id = uuid();
    this.recipientPhoneNumber = recipientPhoneNumber;
    this.active = true;
    this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
  }

  public getId(): string {
    return this.id;
  }

  public setId(id: string) {
    this.id = id;
  }

  public getRecipientPhoneNumber(): string {
    return this.recipientPhoneNumber;
  }

  public getActive(): boolean {
    return this.active;
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: string): void {
    this.createdAt = createdAt;
  }
}
