import OpenAI from "openai";
import dotenv from "dotenv";
import { User } from "./User";
import { Reminder } from "./Reminder";
import moment from "moment";
import { saveReminder } from "../gateway/PlanetScale/WhatsApp";
import { Connection } from "mysql2/promise";
import { saveUser } from "../gateway/PlanetScale/Users";

dotenv.config();

const openai = new OpenAI();
const ASSISTANT_ID = "asst_WNSaVyrLbnfiGbDRtjVcGGub";

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
