import OpenAI from "openai";
import dotenv from "dotenv";
import { User } from "./User";
import { Reminder } from "./Reminder";
import moment from "moment-timezone";
import { saveReminder } from "../gateway/PlanetScale/WhatsApp";
import { Connection } from "mysql2/promise";
import {
  getMessagesByUserId,
  saveMessages,
} from "../gateway/PlanetScale/Messages";
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import { Message } from "./Messages";

dotenv.config();

interface createReminderOpenAI {
  content: string;
  reminder_at: string;
}

const openai = new OpenAI();
const INSTRUCTIONS = `You are an expert virtual assistant specialized in managing reminders. This assistant should be capable of receiving user messages with the intention of creating reminders using the createReminder function. The function requires two mandatory parameters: the content of the reminder and the date for sending it.
Example interaction:
User: "Hello assistant, I want to create a reminder for tomorrow."
Assistant: "Hello! Of course, I'm here to help you create reminders. Please provide the content of the reminder."
User: "I have an important meeting."
Assistant: "Perfect. Now, tomorrow at what time to send the reminder."
User: "Tomorrow at 3:00 PM."
Assistant: "Understood. Reminder successfully created. I will remind you about your important meeting tomorrow at 3:00 PM."
This assistant should be capable of handling situations where the user does not provide complete information and will prompt for the necessary details to effectively create the reminder.`;
const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "createReminder",
      description: "Create a reminder in the database",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The content or text of the reminder",
          },
          reminder_at: {
            type: "string",
            format: "date-time",
            description:
              "The date and time of the reminder in format YYYY-MM-DD HH:mm:ss.SSS",
          },
        },
        required: ["content", "reminder_at"],
      },
    },
  },
];

const getChatCompletion = async (messages: ChatCompletionMessageParam[]) => {
  const stream = openai.beta.chat.completions.stream({
    messages,
    model: "gpt-3.5-turbo-1106",
    tools: TOOLS,
    tool_choice: "auto",
    stream: true,
  });
  const chatCompletion = await stream.finalChatCompletion();
  console.log(JSON.stringify(chatCompletion));
  return chatCompletion;
};

export const runCompletion = async (
  user: User,
  wppMessage: string,
  connection: Connection,
): Promise<Message | null> => {
  const userMessage = new Message("user", wppMessage, user.getId());
  let messagesToSave = [userMessage];
  const databaseMessages =
    (await getMessagesByUserId(user.getId(), connection)) || [];
  let messages: ChatCompletionMessageParam[] = [
    { role: "system", content: INSTRUCTIONS },
    ...buildMessagesToOpenAI(databaseMessages),
    ...buildMessagesToOpenAI([userMessage]),
    {
      role: "system",
      content: `The timezone of the user is ${user.getTimeZone()} and the now is ${moment
        .tz(user.getTimeZone())
        .format("YYYY-MM-DD HH:mm:ss.SSS")}`,
    },
  ];

  let chatCompletion = await getChatCompletion(messages);
  const choice = chatCompletion.choices[0];

  if (choice.finish_reason === "tool_calls") {
    const toolId = choice.message.tool_calls![0].id;
    const toolCall = choice.message!.tool_calls![0];

    const assitantFunction = new Message(
      "assistant",
      undefined,
      user.getId(),
      toolId,
      toolCall,
    );
    const reminderParse = JSON.parse(
      toolCall.function.arguments,
    ) as createReminderOpenAI;

    await createRemindersFromOpenAI(reminderParse, user, connection);
    const toolMessage = new Message(
      "tool",
      `Reminder created and will be remindered at ${reminderParse.reminder_at}`,
      user.getId(),
      toolId,
    );
    messagesToSave.push(assitantFunction);
    messagesToSave.push(toolMessage);

    chatCompletion = await getChatCompletion([
      ...messages,
      ...buildMessagesToOpenAI([assitantFunction]),
      ...buildMessagesToOpenAI([toolMessage]),
    ]);
  }

  let assistantMessage = null;
  if (chatCompletion.choices[0].message?.content) {
    assistantMessage = new Message(
      "assistant",
      chatCompletion.choices[0].message.content,
      user.getId(),
    );
    messagesToSave.push(assistantMessage);
  }

  await saveMessages(messagesToSave, connection);
  return assistantMessage;
};

const buildMessagesToOpenAI = (
  messages: Message[],
): ChatCompletionMessageParam[] => {
  return messages.map((message) => {
    switch (message.getRole()) {
      case "tool":
        return {
          role: message.getRole(),
          content: message.getContent(),
          tool_call_id: message.getToolId()!,
        } as ChatCompletionToolMessageParam;
      case "assistant":
        return {
          role: message.getRole(),
          content: message.getContent(),
          tool_calls: message.getToolCall()
            ? [message.getToolCall()!]
            : undefined,
        } as ChatCompletionAssistantMessageParam;
      default:
        return { role: message.getRole(), content: message.getContent() } as
          | ChatCompletionSystemMessageParam
          | ChatCompletionUserMessageParam;
    }
  });
};

const createRemindersFromOpenAI = async (
  reminderParse: createReminderOpenAI,
  user: User,
  connection: Connection,
) => {
  const { content, reminder_at } = reminderParse;
  const reminder = new Reminder(
    user.getId(),
    moment.tz(reminder_at, user.getTimeZone()).utc(),
    content,
  );
  await saveReminder(reminder, connection);
};
