import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI();

export const getTranscription = async (_audio: any): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream("audio.mp3"),
    model: "whisper-1",
  });
  return transcription.text;
};
