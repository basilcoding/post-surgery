import { GoogleGenAI, Type } from "@google/genai";

export const chatbotResponseSchema = {
    type: Type.OBJECT,
    properties: {
        isEmergency: { type: Type.BOOLEAN },
        isEnd: { type: Type.BOOLEAN },
        botResponse: { type: Type.STRING },
        
    },
    required: ["isEmergency", "isEnd", "botResponse"],
    propertyOrdering: ["isEmergency", "isEnd", "botResponse"]
};
// export const chatbotResponseSchema = {
//     type: Type.OBJECT,
//     properties: {
//         isEmergency: { type: Type.BOOLEAN },
//         isEnd: { type: Type.BOOLEAN },
//         botResponse: { type: Type.STRING },
//         conversationType: {
//             type: Type.STRING,
//             enum: ["normal", "emergency"], // only these two values allowed
//             description: "Indicates whether the conversation is normal or emergency."
//         },
//     },
//     required: ["isEmergency", "isEnd", "botResponse", "conversationType"],
//     propertyOrdering: ["isEmergency", "isEnd", "botResponse", "conversationType"]
// };


export const emergencySummaryBotSchema = {
    type: Type.OBJECT,
    properties: {
        followUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        notes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["followUpQuestions", "notes"],
    propertyOrdering: ["followUpQuestions", "notes"]
}

export const journalSummaryBotSchema = {
    type: Type.OBJECT,
    properties: {
        followUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING } // each note is a detailed clinical summary line
        },
        notes: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING // each note is a detailed clinical summary line
            }
        }
    },
    required: ["followUpQuestions", "notes"],
    propertyOrdering: ["followUpQuestions", "notes"]
};


