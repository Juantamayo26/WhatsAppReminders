import OpenAI from "openai";
import dotenv from "dotenv";
import { User } from "./User";
import { Reminder } from "./Reminder";
import moment from "moment";
import { saveReminder } from "../gateway/PlanetScale/WhatsApp";
import { Connection } from "mysql2/promise";
import { saveUser } from "../gateway/PlanetScale/Users";
import {
  getMessagesByUserId,
  saveMessages,
} from "../gateway/PlanetScale/Messages";
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { Message } from "./Messages";

dotenv.config();

const openai = new OpenAI();
const ASSISTANT_ID = "asst_WNSaVyrLbnfiGbDRtjVcGGub";
const INSTRUCTIONS = `
You are an expert at saving reminders, so the user is going to send you messages and you going to parse that to the createReminder function, the timezone of the user is Colombia/Bogota, in case the user doesn't send the information completely, you going to ask him for more information.
Take into account the two mandatory fields: the \`reminder_at\` and the \`content\` to remind.
`;
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

export const runCompletion = async (
  user: User,
  wppMessage: string,
  connection: Connection,
) => {
  const userMessage = new Message("user", wppMessage, user.getId());
  let messagesToSave = [userMessage];
  const databaseMessages =
    (await getMessagesByUserId(user.getId(), connection)) || [];
  const messages = [
    ...buildMessagesToOpenAI(databaseMessages),
    buildMessagesToOpenAI([userMessage]),
  ];
  console.log(messages);

  const stream = openai.beta.chat.completions.stream({
    messages: [
      ...buildMessagesToOpenAI(databaseMessages),
      ...buildMessagesToOpenAI([userMessage]),
    ],
    model: "gpt-3.5-turbo-1106",
    tools: TOOLS,
    tool_choice: "auto",
    stream: true,
  });

  const chatCompletion = await stream.finalChatCompletion();
  console.log(JSON.stringify(chatCompletion, undefined, 2));
  if (chatCompletion.choices[0].message?.content) {
    messagesToSave.push(
      new Message(
        "assistant",
        chatCompletion.choices[0].message?.content,
        user.getId(),
      ),
    );
  }
  await saveMessages(messagesToSave, connection);
};

const buildMessagesToOpenAI = (
  messages: Message[],
): ChatCompletionMessageParam[] => {
  return messages.map((message) => {
    return {
      role: message.getRole(),
      content: message.getContent(),
    };
  });
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
