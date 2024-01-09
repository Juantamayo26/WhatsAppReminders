import OpenAI from "openai";
import dotenv from "dotenv";
import { User } from "./User";
import { Reminder } from "./Reminder";
import moment from "moment-timezone";
import { saveReminder } from "../gateway/PlanetScale/WhatsApp";
import { Connection } from "mysql2/promise";
import { saveUser } from "../gateway/PlanetScale/Users";
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

const openai = new OpenAI();
const ASSISTANT_ID = "asst_WNSaVyrLbnfiGbDRtjVcGGub";
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
    await createRemindersFromOpenAI(choice, user, connection);
    const toolMessage = new Message(
      "tool",
      "The reminder was created successfully",
      user.getId(),
      toolId,
    );
    messagesToSave.push(toolMessage);

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
  response: ChatCompletion.Choice,
  user: User,
  connection: Connection,
) => {
  const functionArguments = response.message!.tool_calls![0].function.arguments;
  const reminderParse = JSON.parse(functionArguments) as createReminderOpenAI;
  const { content, reminder_at } = reminderParse;
  const reminder = new Reminder(user.getId(), moment(reminder_at), content);
  await saveReminder(reminder, connection);
};

export const runAssistant = async (
  user: User,
  content: string,
  connection: Connection,
) => {
  if (user.getThreadId() === null) {
    const { id } = await openai.beta.threads.create();
    user.setThreadId(id);
    await saveUser(user, connection);
  }

  await openai.beta.threads.messages.create(user.getThreadId()!, {
    role: "user",
    content,
  });

  const run = await openai.beta.threads.runs.create(user.getThreadId()!, {
    assistant_id: ASSISTANT_ID,
  });

  const runWebhook = await pollStatus(run);

  if (runWebhook !== null && runWebhook.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    // prettier-ignore
    // @ts-ignore
    const openAIResponse = messages.data[0].content.find((e) => e.type == "text" ).text.value as string;
    return openAIResponse;
  } else if (runWebhook !== null && runWebhook.status === "requires_action") {
    const toolCalls =
      runWebhook.required_action!.submit_tool_outputs.tool_calls[0];
    const functionArguments = toolCalls.function.arguments;

    const reminderParse = JSON.parse(functionArguments) as createReminderOpenAI;
    const { content, reminder_at } = reminderParse;
    const reminder = new Reminder(user.getId(), moment(reminder_at), content);
    await saveReminder(reminder, connection);
    console.log("SAVE_REMINDER", JSON.stringify(runWebhook));

    openai.beta.threads.runs.submitToolOutputs(run.thread_id, run.id, {
      tool_outputs: [
        {
          tool_call_id: toolCalls.id,
          output: "REMINDER_SAVED",
        },
      ],
    });

    await pollStatus(run);
    const messagess = await openai.beta.threads.messages.list(run.thread_id);
    // prettier-ignore
    // @ts-ignore
    const openAIResponse = messagess!.data[0].content.find((e) => e.type == "text" ).text.value as string;
    return openAIResponse;
  }

  return null;
};

interface createReminderOpenAI {
  content: string;
  reminder_at: string;
}

const pollStatus = async (
  run: OpenAI.Beta.Threads.Run,
  interval = 2000,
  maxRetries = 10,
) => {
  try {
    let status = "";
    let data = null;
    let retryCount = 0;

    while (status !== "completed" && status !== "requires_action") {
      if (retryCount >= maxRetries) {
        throw new Error("Max retries exceeded");
      }

      const runStatus = await openai.beta.threads.runs.retrieve(
        run.thread_id,
        run.id,
      );
      status = runStatus.status;
      data = runStatus;
      retryCount++;
      if (status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    return data;
  } catch (err) {
    throw err;
  }
};
