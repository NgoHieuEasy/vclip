import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
const ai = new GoogleGenAI({ apiKey: "DUMMY" });
fs.writeFileSync('dummy', 'dummy data'); // NO EXTENSION
async function run() {
  try {
    await ai.files.upload({
      file: 'dummy',
      mimeType: 'video/mp4' // testing old syntax
    });
  } catch (e) {
    console.error(e.message);
  }
}
run();
