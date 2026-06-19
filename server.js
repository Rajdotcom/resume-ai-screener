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

dotenv.config({ path: envPath });
console.log("🔌 VALUE EVALUATED BY MONGOOSE:", process.env.MONGODB_URI ? "Loaded String Successfully!" : "Still Undefined");
console.log("==================================================");

// 2. DATABASE IMPORTS
import connectDB from './config/db.js'; 
import CandidateProfile from './models/CandidateProfile.js'; 

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: "AI Resume Screener API is running smoothly!" });
});

app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    
    const jobDescription = req.body.jobDescription || "Standard criteria.";
    const extractedText = await extractTextFromFile(req.file.path);
    const aiAnalysis = await analyzeResumeWithAI(extractedText, jobDescription);

    // 🔍 DEBUG LOG: Look at your Render web service logs to see the exact shape Gemini returns!
    console.log("🤖 RAW AI ENGINE OUTPUT OBJECT:", JSON.stringify(aiAnalysis, null, 2));

    // 🚀 MULTI-KEY FALLBACK MAPPING
    // This checks both custom backend schemas and default frontend naming metrics
    const candidateDocument = new CandidateProfile({
      candidateName: aiAnalysis.extractedCandidateName || aiAnalysis.candidateName || aiAnalysis.name || "Unidentified",
      extractedEmail: aiAnalysis.extractedCandidateEmail || aiAnalysis.email || null,
      systemFilename: req.file.filename,
      targetJobTitle: aiAnalysis.evaluatedTargetRole || aiAnalysis.targetJobTitle || aiAnalysis.jobTitle || "Not Specified",
      rawTextPayload: extractedText,
      aiEvaluation: {
        suitabilityScore: aiAnalysis.suitabilityScore || aiAnalysis.matchPercentage || aiAnalysis.score || 0,
        executiveSummary: aiAnalysis.executiveSummary || aiAnalysis.summary || "None",
        technicalStrengths: aiAnalysis.technicalStrengths || aiAnalysis.strengths || [],
        operationalWeaknesses: aiAnalysis.operationalWeaknesses || aiAnalysis.weaknesses || [],
        missingSkillsGaps: aiAnalysis.missingSkillsGaps || aiAnalysis.missingSkills || [],
        generatedBlueprint: aiAnalysis.generatedBlueprint || aiAnalysis.blueprint || []
      }
    });

    const savedProfile = await candidateDocument.save();

    res.status(200).json({ 
      success: true, 
      profileId: savedProfile._id,
      analysis: savedProfile.aiEvaluation, 
      aiAnalysis: aiAnalysis,
      
      // Secondary fallback spread to ensure the React frontend hooks match instantly
      suitabilityScore: savedProfile.aiEvaluation.suitabilityScore,
      executiveSummary: savedProfile.aiEvaluation.executiveSummary,
      technicalStrengths: savedProfile.aiEvaluation.technicalStrengths || [],
      operationalWeaknesses: savedProfile.aiEvaluation.operationalWeaknesses || [],
      missingSkillsGaps: savedProfile.aiEvaluation.missingSkillsGaps || [],
      generatedBlueprint: savedProfile.aiEvaluation.generatedBlueprint || []
    });

  } catch (error) {
    console.error("❌ BACKEND SERVER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});