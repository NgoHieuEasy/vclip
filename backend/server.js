import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Set up multer for handling file uploads (saving temporarily to 'uploads' folder)
const upload = multer({ dest: 'uploads/', limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB max

// Initialize Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoint to receive video and generate script
app.post('/api/generate-script', upload.single('video'), async (req, res) => {
  console.log("req.file===>",req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype || 'video/mp4'; // Fallback if undefined
  let filePathWithExt = filePath;

  try {
    if (!process.env.GEMINI_API_KEY) {
       throw new Error('GEMINI_API_KEY is not configured in the backend.');
    }

    console.log(`Received file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    console.log(`MimeType from Multer: ${mimeType}`);

    // Rename file to include extension so SDK can infer it easily
    const ext = path.extname(req.file.originalname) || '.mp4';
    filePathWithExt = filePath + ext;
    fs.renameSync(filePath, filePathWithExt);

    console.log('Uploading file to Gemini API...');

    // Upload file to Gemini
    const uploadResult = await ai.files.upload({
      file: filePathWithExt,
      config: {
        mimeType: mimeType,
        displayName: req.file.originalname
      }
    });

    console.log(`Upload complete. File URI: ${uploadResult.uri}`);
    console.log('Waiting for file processing to complete...');

    // Wait until the file is active (processed)
    let fileState = await ai.files.get({ name: uploadResult.name });
    while (fileState.state === 'PROCESSING') {
        console.log('File is still processing, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        fileState = await ai.files.get({ name: uploadResult.name });
    }

    if (fileState.state === 'FAILED') {
        throw new Error('File processing failed on Gemini servers.');
    }

    console.log('File is ready. Generating script...');

    // Call the model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType
          }
        },
        { text: "Hãy xem video này và viết cho tôi một kịch bản thuyết minh chi tiết, khớp với thời gian diễn biến trong video để tôi lồng tiếng. Ngữ điệu tự nhiên, hấp dẫn. Ngôn ngữ: Tiếng Việt." }
      ],
    });

    const generatedText = response.text;
    console.log('Script generated successfully.');

    // Clean up temporary file
    if (fs.existsSync(filePathWithExt)) {
      fs.unlinkSync(filePathWithExt);
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ script: generatedText });

  } catch (error) {
    console.error('Error generating script:', error);
    // Cleanup on error
    if (fs.existsSync(filePathWithExt)) {
      fs.unlinkSync(filePathWithExt);
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: error.message || 'Failed to generate script' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
