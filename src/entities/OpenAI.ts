import OpenAI from "openai";
import dotenv from "dotenv";
import { User } from "./User";
import { RecurrencePayload, Reminder } from "./Reminder";
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

interface CreateReminderOpenAI {
  content: string;
  reminder_at: string;
  recurrence?: RecurrencePayload;
}

const openai = new OpenAI();
const INSTRUCTIONS = `You are an expert virtual assistant specialized in managing reminders.
This assistant is designed to receive user messages with the intention of creating reminders using the createReminder function.
The function requires two mandatory parameters: the content of the reminder and the date for sending it.

Example interaction:
User: "Hello assistant, I want to create a reminder for tomorrow."
Assistant: "Hello! Of course, I'm here to help you create reminders. Please provide the content of the reminder."
User: "I have an important meeting."
Assistant: "Perfect. Now, let's set the date and time for the reminder. When would you like to be reminded about your important meeting?"
User: "Tomorrow at 3:00 PM."
Assistant: "Understood. Reminder successfully created. I will remind you about your important meeting tomorrow at 3:00 PM."

This assistant is capable of handling situations where the user does not provide complete information.
If a user mentions tomorrow without specifying a time, the assistant will prompt for both the date and time to ensure the reminder is effectively created.

Also the assistant will respond in the language in which the user interacts, as it is designed to adapt to the user's language automatically.
Note: The assistant will omit responses and function creations related to reminding once the reminder is created, as it is designed to be efficient and avoid redundancy in its interactions.`;

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
        recurrence: {
          type: "object",
          properties: {
            frequency: {
              type: "integer",
              description: "The frequency of the recurrence",
            },
            unit: {
              type: "string",
              description:
                "The unit of time for recurrence (e.g., 'month', 'year')",
            },
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
    // TODO: Runs all the tools
    // const tools = choice.message.tool_calls;
    // for (const tool of tools!) {
    //   await runTool(tool);
    // }

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
    ) as CreateReminderOpenAI;

    await createRemindersFromOpenAI(reminderParse, user, connection);
    const toolMessage = new Message(
      "tool",
      `Reminder created and will be remindered at ${reminderParse.reminder_at}`,
      user.getId(),
      toolId,
    );
    messagesToSave.push(assitantFunction, toolMessage);

    chatCompletion = await getChatCompletion([
      ...messages,
      ...buildMessagesToOpenAI([assitantFunction, toolMessage]),
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
        // const toolMessage = message.shouldBeSaved() ? message.getContent() :
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
  reminderParse: CreateReminderOpenAI,
  user: User,
  connection: Connection,
) => {
  const { content, reminder_at, recurrence } = reminderParse;
  if (recurrence) {
  }
  const reminder = new Reminder(
    user.getId(),
    moment.tz(reminder_at, user.getTimeZone()).utc().subtract(1, "minutes"),
    content,
  );
  await saveReminder(reminder, connection);
};
