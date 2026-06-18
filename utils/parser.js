import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse-fork'; // Modern fork that supports ES Modules perfectly

/**
 * Extracts raw text from an uploaded file based on its extension.
 * @param {string} filePath - The path to the file on the server.
 * @returns {Promise<string>} - The extracted text.
 */
export const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  // Read the file into a binary buffer
  const fileBuffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    // This fork exports a standard function that works perfectly out of the box
    const data = await pdf(fileBuffer);
    return data.text;
  } 
  
  if (ext === '.docx') {
    // Parse Word Document
    const data = await mammoth.extractRawText({ buffer: fileBuffer });
    return data.value;
  }

  throw new Error("Unsupported file format for parsing.");
};