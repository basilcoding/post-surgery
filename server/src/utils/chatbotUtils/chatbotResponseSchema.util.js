import { GoogleGenAI, Type } from "@google/genai";

export const stopAndEmergencyResponseSchema = {
    type: Type.OBJECT,
    properties: {
        isEmergency: { type: Type.BOOLEAN },
        isConversationEnded: { type: Type.BOOLEAN }
    },
    required: ["isEmergency", "isConversationEnded"],
    propertyOrdering: ["isEmergency", "isConversationEnded"]
}

// export const chatbotResponseSchema = {
//     type: Type.OBJECT,
//     properties: {
//         isEmergency: { type: Type.BOOLEAN },
//         isConversationEnded: { type: Type.BOOLEAN },
//         botResponse: { type: Type.STRING } // The new property
//     },
//     required: ["isEmergency", "isConversationEnded", "botResponse"],
//     propertyOrdering: ["isEmergency", "isConversationEnded", "botResponse"]
// }

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


