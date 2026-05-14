import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const models = await ai.models.list();
    for await (const model of models) {
       if (model.name.includes("pro")) {
         console.log(model.name);
       }
    }
  } catch(e) { console.error(e.message); }
}
run();
