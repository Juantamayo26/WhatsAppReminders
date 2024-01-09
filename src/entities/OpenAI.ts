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
  ChatCompletion,
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
const INSTRUCTIONS = `
You are an expert at saving reminders, so the user is going to send you messages and you going to parse that to the createReminder function, the timezone of the user is Colombia/Bogota, 
in case the user doesn't send the information completely, you going to ask him for more information.
Take into account the two mandatory fields: the \`reminder_at\` and the \`content\` to remind.`;
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
  console.log(JSON.stringify(chatCompletion, null, 2));
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
    const functionArguments = choice.message!.tool_calls![0].function.arguments;
    const reminderParse = JSON.parse(functionArguments) as createReminderOpenAI;

    await createRemindersFromOpenAI(reminderParse, user, connection);
    const toolMessage = new Message(
      "tool",
      `Reminder created and will be remindered at ${reminderParse.reminder_at}`,
      user.getId(),
      toolId,
    );
    messagesToSave.push(toolMessage);
    console.log(buildMessagesToOpenAI([toolMessage]));

    chatCompletion = await getChatCompletion([
      ...messages,
      ...buildMessagesToOpenAI([toolMessage]),
    ]);
  }

  let assistantMessage = null;
  if (choice.message?.content) {
    assistantMessage = new Message(
      "assistant",
      choice.message?.content,
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
      default:
        return { role: message.getRole(), content: message.getContent() } as
          | ChatCompletionSystemMessageParam
          | ChatCompletionUserMessageParam
          | ChatCompletionAssistantMessageParam;
    }
  });
};

const createRemindersFromOpenAI = async (
  reminderParse: createReminderOpenAI,
  user: User,
  connection: Connection,
) => {
  const { content, reminder_at } = reminderParse;
  const reminder = new Reminder(user.getId(), moment(reminder_at), content);
  await saveReminder(reminder, connection);
};
