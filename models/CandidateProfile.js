import mongoose from 'mongoose';

// 1. Nested Sub-schema for Tailored Interview Questions
const InterviewQuestionSchema = new mongoose.Schema({
  questionType: { 
    type: String, 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  evaluationFocus: { 
    type: String, 
    required: true 
  }
});

// 2. Nested Sub-schema for Deep AI Analytics
const AIAnalysisSchema = new mongoose.Schema({
  suitabilityScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    required: true 
  },
  executiveSummary: { 
    type: String, 
    required: true 
  },
  technicalStrengths: [{ type: String }],
  operationalWeaknesses: [{ type: String }],
  missingSkillsGaps: [{ type: String }],
  generatedBlueprint: [InterviewQuestionSchema] // Array of nested interview questions
});

// 3. Primary Core Candidate Schema
const CandidateProfileSchema = new mongoose.Schema({
  candidateName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  extractedEmail: { 
    type: String, 
    lowercase: true, 
    trim: true,
    index: true // Optimizes lookup speeds for duplicate checks
  },
  systemFilename: { 
    type: String, 
    required: true 
  },
  targetJobTitle: { 
    type: String, 
    required: true, 
    trim: true 
  },
  rawTextPayload: { 
    type: String, 
    required: true 
  }, // Stores the full text stripped from the PDF/Docx
  aiEvaluation: AIAnalysisSchema // Embeds the AI schema directly
}, { 
  timestamps: true, // Automatically manages createdAt and updatedAt tracking fields
  collection: 'candidate_profiles' // Explicitly names the MongoDB collection
});

// Create high-performance database indexes
CandidateProfileSchema.index({ 'aiEvaluation.suitabilityScore': -1 }); // Fast leaderboard sorting
CandidateProfileSchema.index({ createdAt: -1 }); // Fast sorting by newest applicants

const CandidateProfile = mongoose.model('CandidateProfile', CandidateProfileSchema);
export default CandidateProfile;