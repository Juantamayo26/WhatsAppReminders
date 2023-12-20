import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI();

export const createAssistant = async () => {
  const myAssistant = await openai.beta.assistants.create({
    instructions:
      "You are a personal math tutor. When asked a question, write and run Python code to answer the question.",
    name: "WhatsApp Reminders",
    tools: [
      {
        type: "function",
        function: {
          name: "getCurrentWeather",
          description: "Get the weather in location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state e.g. San Francisco, CA",
              },
              unit: { type: "string", enum: ["c", "f"] },
            },
            required: ["location"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "getNickname",
          description: "Get the nickname of a city",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state e.g. San Francisco, CA",
              },
            },
            required: ["location"],
          },
        },
      },
    ],
    model: "gpt-3.5-turbo-1106",
  });

  console.log(myAssistant);
};
