
import { GoogleGenAI, Type } from "@google/genai";
import { Syllabus, StudyPlan, Topic } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeSyllabusText = async (syllabusText: string): Promise<Syllabus> => {
  if (!API_KEY) throw new Error("API Key is not configured.");

  const model = "gemini-2.5-flash";
  const prompt = `Analyze the following syllabus text and extract the course name and a structured list of topics and their sub-topics. Format the output as a JSON object that strictly adheres to the provided schema.

Syllabus Text:
---
${syllabusText}
---
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courseName: { type: Type.STRING },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topicName: { type: Type.STRING },
                subTopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    },
  });
  
  const jsonText = response.text.trim();
  return JSON.parse(jsonText) as Syllabus;
};


export const findWeakTopics = async (assessmentImage: File, syllabus: Syllabus): Promise<Topic[]> => {
    if (!API_KEY) throw new Error("API Key is not configured.");

    const model = "gemini-2.5-flash";
    const imagePart = await fileToGenerativePart(assessmentImage);
    const syllabusText = `Course: ${syllabus.courseName}, Topics: ${syllabus.topics.map(t => t.topicName).join(', ')}`;
    
    const prompt = `
    Analyze the provided image of a student's assessment answers. Based on the mistakes or incomplete answers in the image, identify the student's weak topics from the following list. Provide your response as a JSON object adhering to the specified schema. Only include topics where you have high confidence of weakness based on the image.

    Syllabus Topics:
    ${syllabusText}
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    weakTopics: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                topicName: { type: Type.STRING },
                                subTopics: {
                                  type: Type.ARRAY,
                                  items: { type: Type.STRING },
                                },
                                reason: { type: Type.STRING, description: "A brief explanation of why this topic is considered weak based on the assessment."}
                            }
                        }
                    }
                }
            }
        }
    });

    const result = JSON.parse(response.text.trim());
    return result.weakTopics as Topic[];
};


export const generateStudyPlan = async (weakTopics: Topic[]): Promise<StudyPlan> => {
  if (!API_KEY) throw new Error("API Key is not configured.");
  const model = 'gemini-2.5-flash';
  
  const topicsString = weakTopics.map(t => t.topicName).join(', ');

  const prompt = `
  Create a personalized 7-day study plan to help a student improve on the following weak topics: ${topicsString}.
  The plan should include a mix of activities like reviewing concepts, reading specific material, and doing practice problems.
  For each task, specify the day, a clear description, the relevant topic, a suggested type ('review', 'practice', 'read'), and an estimated time in minutes.
  The output must be a JSON object that strictly adheres to the provided schema. Each task must have a unique ID.
  `;
  
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          startDate: { type: Type.STRING, description: "Start date in ISO 8601 format" },
          duration: { type: Type.INTEGER, description: "Duration in days, should be 7" },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                day: { type: Type.INTEGER },
                task: { type: Type.STRING },
                topic: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['review', 'practice', 'read'] },
                isCompleted: { type: Type.BOOLEAN },
                estimatedTime: { type: Type.INTEGER },
              }
            }
          }
        }
      }
    }
  });

  const plan = JSON.parse(response.text.trim()) as StudyPlan;
  // Ensure isCompleted is false for all new tasks
  plan.tasks = plan.tasks.map(task => ({ ...task, isCompleted: false }));
  return plan;
};

// For AI Tutor chat
let chat: any = null; // Ideally, manage this with a better state solution

export const startTutorChat = () => {
  if (!API_KEY) throw new Error("API Key is not configured.");
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: "You are Xenia, a friendly and encouraging AI study tutor. Your goal is to help students understand concepts without giving away the direct answer. Guide them with step-by-step explanations, hints, and clarifying questions. If a student uploads an image of a problem, analyze it and help them solve it. Keep your tone positive and supportive.",
    },
  });
};

export const sendTutorMessageStream = async (message: string, image?: File) => {
    if (!API_KEY) throw new Error("API Key is not configured.");
    if (!chat) startTutorChat();
    
    let contents: any = { message };
    if (image) {
      const imagePart = await fileToGenerativePart(image);
      contents = { message: { parts: [ {text: message}, imagePart ]}};
    }

    return chat.sendMessageStream(contents);
};
