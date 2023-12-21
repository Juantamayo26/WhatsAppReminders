import moment from "moment";
import { v4 as uuid } from "uuid";

// export interface Message {
//   id: number;
//   role: string;
//   content: string;
//   created_at: string;
// }

// export class Message {
//   private id: string;
//   private role: string;
//   private content: string;
//   private createdAt: string;
//
//   public loadMessage(
//     id: string,
//     role: string,
//     content: string,
//     createdAt: string,
//   ): Message {
//     const message = new Message(role, content);
//     message.setId(id);
//     message.setCreatedAt(createdAt);
//     return message;
//   }
//
//   constructor(role: string, content: string) {
//     this.id = uuid();
//     this.role = role;
//     this.content = content;
//     this.createdAt = moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS");
//   }
//
//   public getId(): string {
//     return this.id;
//   }
//
//   public getRole(): string {
//     return this.role;
//   }
//
//   public getContent(): string {
//     return this.content;
//   }
//
//   public getCreatedAt(): string {
//     return this.createdAt;
//   }
// }
