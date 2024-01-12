import OpenAI, { toFile } from "openai";

const openai = new OpenAI();

export const getTranscription = async (audio: Buffer): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: await toFile(audio, "audio.mp3"),
    model: "whisper-1",
  });
  return transcription.text;
};
