import { GoogleGenerativeAI } from '@google/generative-ai'; // <-- Changed to GoogleGenerativeAI
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Generative AI client using the standard class name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sends resume text and a job description to Gemini for structured analysis.
 * @param {string} resumeText - Raw parsed text from the resume file.
 * @param {string} jobDescription - Requirements provided by the recruiter.
 * @returns {Promise<Object>} - Structured evaluation JSON.
 */
export const analyzeResumeWithAI = async (resumeText, jobDescription) => {
  try {
    // Get the model (gemini-2.5-flash is perfect for text analysis tasks)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert ATS (Applicant Tracking System) and professional recruiter.
      Analyze the following candidate's Resume Text against the provided Job Description.
      
      Job Description:
      "${jobDescription}"
      
      Candidate Resume Text:
      "${resumeText}"
      
      Provide your complete analysis strictly in the following JSON format. Do not include markdown code block formatting (like \`\`\`json). Just return the raw JSON object string.
      
      {
        "matchPercentage": 0,
        "summary": "A 2-3 sentence overview of who this candidate is and their general fit.",
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "missingSkills": ["Skill 1", "Skill 2"],
        "interviewQuestions": ["Question 1", "Question 2"],
        "hiringRecommendation": "Strong Hire / Hire / No Hire"
      }
    `;

    const response = await model.generateContent(prompt);
    const result = await response.response;
    let cleanText = result.text().trim();

    // Clean up response formatting if the model accidentally returns markdown wrappers
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json|```/g, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```/g, '').trim();
    }

    // Convert the string response directly into an operational JavaScript object
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini AI Engine Error:", error);
    throw new Error("Failed to process profile analysis with AI: " + error.message);
  }
};