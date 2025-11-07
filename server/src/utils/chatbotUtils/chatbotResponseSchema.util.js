import { GoogleGenAI, Type } from "@google/genai";

export const chatbotResponseSchema = {
    type: Type.OBJECT,
    properties: {
        isEnd: { type: Type.BOOLEAN },
        botResponse: { type: Type.STRING },
        suggestedReplies: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        requiresNumericalInput: { type: Type.BOOLEAN },
    },
    required: ["isEnd", "botResponse", "requiresNumericalInput"],
    propertyOrdering: ["isEnd", "botResponse", "suggestedReplies", "requiresNumericalInput"]
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


// export const summarybotSchema = {
//     type: Type.OBJECT,
//     properties: {
//         isEmergency: { type: Type.BOOLEAN },
//         followUpQuestions: {
//             type: Type.ARRAY,
//             items: { type: Type.STRING }
//         },
//         content: {
//             type: Type.ARRAY,
//             items: { type: Type.STRING }
//         }
//     },
//     required: ["isEmergency", "followUpQuestions", "content"],
//     propertyOrdering: ["isEmergency", "followUpQuestions", "content"]
// }

export const journalSummarybotSchema = {
    type: Type.OBJECT,
    properties: {
        followUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING } // each note is a detailed clinical summary line
        },
        summaryType: {
            type: Type.STRING,
            enum: ["journal", "emergency"],
            description: "Indicates whether the whole summary of the journal is an emergency or not"
        },
        content: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING // each note is a detailed clinical summary line
            }
        }
    },
    required: ["followUpQuestions", "summaryType", "content"],
    propertyOrdering: ["followUpQuestions", "summaryType", "content"]
};

export const emergencySummarybotSchema = {
    type: Type.OBJECT,
    properties: {
        followUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING } // each note is a detailed clinical summary line
        },
        summaryType: {
            type: Type.STRING,
            enum: ["journal", "emergency"],
            description: "Indicates whether the whole summary is an emergency or not"
        },
        content: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING // each note is a detailed clinical summary line
            }
        }
    },
    required: ["followUpQuestions", "summaryType", "content"],
    propertyOrdering: ["followUpQuestions", "summaryType", "content"]
};


