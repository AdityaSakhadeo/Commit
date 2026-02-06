import { GoogleGenAI, Type } from "@google/genai";
import { Domain, Task } from "../types";

// Safety check: Safely access process.env using optional chaining
// This prevents crashes in environments where process exists but process.env is undefined
const apiKey = (typeof process !== 'undefined' && process?.env?.API_KEY) ? process.env.API_KEY : '';

// Initialize AI. Note: If apiKey is empty, calls will fail, but the app won't crash on load.
const ai = new GoogleGenAI({ apiKey: apiKey });

interface DayPlan {
  day_title: string;
  tasks: string[];
}

export interface AIPlanResponse {
  title: string;
  description: string;
  setup_tasks: string[];
  schedule_cycle: DayPlan[];
  duration_days: number;
}

export interface AIChatResponse {
  message: string;
  suggested_tasks?: string[]; // If present, replaces the tasks for the day
}

export const generateGoalPlan = async (domain: Domain, userInput: string, duration?: string): Promise<AIPlanResponse | null> => {
  try {
    const prompt = `
      You are an expert elite performance coach specializing in ${domain}.
      The user wants to achieve: "${userInput}".
      ${duration ? `User's target duration: ${duration}.` : 'User has not specified a duration, set a default of 30 days.'}
      
      Create a highly detailed, actionable plan. 
      DO NOT be vague. DO NOT say "Exercise". Say "3 sets of 10 Pushups".
      DO NOT say "Study". Say "Read Chapter 1 of 'You Don't Know JS' and write summary".
      
      The plan must have two parts:
      1. Setup Tasks: Detailed one-time actions to prepare.
      2. Routine Schedule: A repeating cycle of days (e.g. a 7-day weekly split for fitness, or a 1-day cycle for daily habits).
      
      For Fitness goals: Use a split (e.g. Push/Pull/Legs or Upper/Lower) if appropriate. Specify exercises, sets, and reps.
      For Learning goals: Specify the exact topic or resource to cover for that day in the cycle.
      
      Output JSON format:
      - title: Short, motivating title.
      - description: Motivational summary.
      - setup_tasks: Array of detailed strings (3-5 items).
      - schedule_cycle: Array of objects, where each object represents a day in the repeating cycle.
         - day_title: Theme of the day (e.g. "Leg Day", "React Hooks", "Rest Day").
         - tasks: Array of specific actionable strings for that day.
      - duration_days: Integer (Total duration of the goal).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            setup_tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            schedule_cycle: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day_title: { type: Type.STRING },
                  tasks: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
                },
                required: ["day_title", "tasks"]
              }
            },
            duration_days: { type: Type.INTEGER }
          },
          required: ["title", "description", "setup_tasks", "schedule_cycle", "duration_days"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIPlanResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const suggestGoals = async (domain: Domain): Promise<string[]> => {
  try {
     const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 4 popular, specific, short goal ideas for the life domain: ${domain}. Return only a JSON array of strings. Examples: "Run a 5K", "Read 12 Books", "Save $1000".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini Suggestion Error", error);
    return ["Run 5k", "Read 1 book", "Drink more water"]; // Fallback
  }
};

export const getGoalCoachTip = async (goalTitle: string, domain: string, progress: number): Promise<string> => {
  try {
    const prompt = `
      You are a motivational coach for the domain: ${domain}.
      The user is working on: "${goalTitle}" and is ${progress}% done.
      Give them one short, punchy, specific tip or motivational quote (max 20 words) to keep them going right now.
      Do not start with "Here is a tip". Just say the tip.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return response.text || "Keep pushing, you're doing great!";
  } catch (e) {
    console.error(e);
    return "Consistency is key. Keep showing up!";
  }
};

export const chatWithDayCoach = async (
  goalTitle: string,
  domain: string,
  dayNumber: number,
  currentTasks: Task[],
  userMessage: string
): Promise<AIChatResponse> => {
  try {
    const taskList = currentTasks.map(t => t.title).join("; ");
    
    const prompt = `
      You are a helpful, encouraging coach for a ${domain} goal: "${goalTitle}".
      It is Day ${dayNumber}.
      Current tasks: ${taskList}
      
      User says: "${userMessage}"
      
      1. If the user asks for advice, tips, or clarification, provide a short, helpful answer.
      2. If the user asks to CHANGE, SWAP, or MODIFY the routine (e.g. "I'm injured", "I don't have gym access", "Make it harder"), you MUST provide new specific tasks in the 'suggested_tasks' array.
      
      Output JSON:
      {
        "message": "Your conversational response here.",
        "suggested_tasks": ["New Task 1", "New Task 2"] // Optional. Only include if plan should change.
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            suggested_tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["message"]
        }
      }
    });

    const text = response.text;
    if (!text) return { message: "I'm having trouble connecting to the coaching server." };
    return JSON.parse(text) as AIChatResponse;
  } catch (e) {
    console.error(e);
    return { message: "Sorry, I couldn't process that request right now." };
  }
};