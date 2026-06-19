import express from 'express';
import cors from 'cors';
import upload from './middleware/uploadMiddleware.js';
import { extractTextFromFile } from './utils/parser.js';
import { analyzeResumeWithAI } from './utils/aiEngine.js'; 

// 1. ABSOLUTE PATH & HARDWARE DIAGNOSTICS
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

console.log("==================================================");
console.log("🚨 CORE FILE SYSTEM DIAGNOSTICS 🚨");
console.log("📁 Looking for .env at:", envPath);

// Verify physical existence of local variables
if (fs.existsSync(envPath)) {
  console.log("✅ FILE STATUS: Physical .env file found!");
  
  const rawContent = fs.readFileSync(envPath, 'utf8');
  if (rawContent.includes('MONGODB_URI')) {
    console.log("✅ CONTENT STATUS: 'MONGODB_URI' key exists inside the file.");
  } else {
    console.log("❌ CONTENT STATUS: The file exists, but it is MISSING the 'MONGODB_URI' variable name!");
  }
} else {
  console.log("❌ FILE STATUS: Zero file found. Node cannot see a .env file here at all.");
}

// Force load the configuration path
dotenv.config({ path: envPath });
console.log("🔌 VALUE EVALUATED BY MONGOOSE:", process.env.MONGODB_URI ? "Loaded String Successfully!" : "Still Undefined");
console.log("==================================================");

// 2. DATABASE IMPORTS
import connectDB from './config/db.js'; 
import CandidateProfile from './models/CandidateProfile.js'; 

// Initialize database connection
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: "AI Resume Screener API is running smoothly!" });
});

// Primary parsing and processing endpoint
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    
    const jobDescription = req.body.jobDescription || "Standard criteria.";
    const extractedText = await extractTextFromFile(req.file.path);
    const aiAnalysis = await analyzeResumeWithAI(extractedText, jobDescription);

    const candidateDocument = new CandidateProfile({
      candidateName: aiAnalysis.extractedCandidateName || "Unidentified",
      extractedEmail: aiAnalysis.extractedCandidateEmail || null,
      systemFilename: req.file.filename,
      targetJobTitle: aiAnalysis.evaluatedTargetRole || "Not Specified",
      rawTextPayload: extractedText,
      aiEvaluation: {
        suitabilityScore: aiAnalysis.suitabilityScore || 0,
        executiveSummary: aiAnalysis.executiveSummary || "None",
        technicalStrengths: aiAnalysis.technicalStrengths || [],
        operationalWeaknesses: aiAnalysis.operationalWeaknesses || [],
        missingSkillsGaps: aiAnalysis.missingSkillsGaps || [],
        generatedBlueprint: aiAnalysis.generatedBlueprint || []
      }
    });

    const savedProfile = await candidateDocument.save();

    // 🚀 BULLETPROOF DUAL-SHAPE RESPONSE
    // This sends the data in both flat and nested configurations. 
    // It guarantees that React will find the arrays it needs for .map()
    res.status(200).json({ 
      success: true, 
      profileId: savedProfile._id,
      analysis: savedProfile.aiEvaluation, 
      aiAnalysis: aiAnalysis,
      
      // Flattened properties fallback to safely satisfy frontend mapping loops
      suitabilityScore: savedProfile.aiEvaluation.suitabilityScore,
      executiveSummary: savedProfile.aiEvaluation.executiveSummary,
      technicalStrengths: savedProfile.aiEvaluation.technicalStrengths || [],
      operationalWeaknesses: savedProfile.aiEvaluation.operationalWeaknesses || [],
      missingSkillsGaps: savedProfile.aiEvaluation.missingSkillsGaps || [],
      generatedBlueprint: savedProfile.aiEvaluation.generatedBlueprint || []
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});