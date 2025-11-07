import { GoogleGenAI } from "@google/genai";

import Chatbot from '../../models/chatbot.model.js';
import PatientProfile from '../../models/patientProfile.model.js'
import CareCheckList from '../../models/careCheckList.model.js'

import { emitSummary } from "./emitSummary.util.js";

import { ioInstance } from "../../lib/socket.js";

import {
    journalChatbotPrompt,
    emergencyChatbotPrompt,
    emergencySummarybotPrompt,
    journalSummarybotPrompt,
    generalChatbotPrompt,

} from './chatbotPrompts.util.js';

import {
    chatbotResponseSchema,
    emergencySummarybotSchema,
    journalSummarybotSchema,
} from './chatbotResponseSchema.util.js';

import { formatMedicalHistory } from "./formatMedicalHistory.js";
import { formatSurgeryChecklist } from "./formatSurgeryChecklist.js";

import { sendMail } from '../../lib/email.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper functions given below
// 1)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const maxRetries = 5;
const retryDelayMs = 3000; // 3 seconds
let lastError = null;

// 2)
function getRecentHistory(history, n = 16) {
    return Array.isArray(history) ? history.slice(-n) : [];
}

export const chatbot = async function (userId, message, isEnd, relationship, chatbotType = 'journal') {
    try {
        console.log("\nchatAgent called successfully called");
        console.log(`userId: ${userId}, Message: "${message}", isEnd: ${isEnd}`);

        const surgeryIdentifier = relationship.surgeryIdentifier; // e.g., "total-knee-replacement-v1"

        // Load chat from DB or create a new one
        let chats = await Chatbot.findOne({ userId, chatbotType: chatbotType });
        const patientProfile = await PatientProfile.findOne({ user: userId });
        const protocol = await CareCheckList.findOne({ identifier: surgeryIdentifier });

        if (!chats) {
            chats = new Chatbot({ userId, chatbotType: chatbotType });
            console.log("creating new record.");
        } else {
            console.log(`found a chat. length is ${chats.history.length}`);
        }

        // console.log("checking if its an emergency");
        const recentHistory = getRecentHistory(chats.history, 50);
        // Create a new array containing ONLY the fields the AI needs.
        // This strips off 'suggestedReplies', 'timestamp', and any Mongoose IDs.
        const cleanedHistory = recentHistory.map(msg => ({
            role: msg.role,
            parts: msg.parts
        }));
        const chatbotContext = [
            ...cleanedHistory,
            { role: "user", parts: [{ text: message }] }
        ];
        console.log('chatbot context is: ', chatbotContext)


        const patientMedicalHistory = formatMedicalHistory(patientProfile);
        const surgeryChecklist = formatSurgeryChecklist(protocol);

        // MAKE LOCAL VARIABLE, IMPORTANT: Dont do chatbotPrompt += patientMedicalHistory !!! Users data will get mixed up!! It will keep growing indefinitely by appending to the same variable during every request!! Never modify an imported variable!!
        let fullSystemPrompt;
        if (chats.chatbotType === 'journal') {
            fullSystemPrompt = journalChatbotPrompt + patientMedicalHistory + surgeryChecklist;
            // console.log('Chatbot prompt is: ', fullSystemPrompt);
        } else if (chats.chatbotType === 'emergency') {
            fullSystemPrompt = emergencyChatbotPrompt + patientMedicalHistory + surgeryChecklist;
            // console.log('Chatbot prompt is: ', fullSystemPrompt);
        } else {
            fullSystemPrompt = generalChatbotPrompt + patientMedicalHistory + surgeryChecklist;
        }

        let chatbotResponse;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Chatbot API attempt ${attempt}/${maxRetries}...`);
                chatbotResponse = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: chatbotContext,
                    config: {
                        systemInstruction: fullSystemPrompt,
                        responseMimeType: "application/json",
                        responseSchema: chatbotResponseSchema
                    }
                });
                // If successful, break the loop
                break;
            } catch (error) {
                console.error(`Chatbot API attempt ${attempt} failed:`, error.message);
                lastError = error;
                if (attempt === maxRetries) {
                    console.error("All retry attempts failed for chatbot.");
                    throw lastError; // Throw the last error to be caught by outer try...catch
                }
                // Wait for the delay before retrying
                await delay(retryDelayMs);
            }
        }

        const parsedResponse = JSON.parse(chatbotResponse.text);
        console.log("checking bots result: ", parsedResponse);

        const botResponseText = parsedResponse.botResponse;
        // console.log("bot response is: ", botResponseText);

        // --- Key logic: if chat was ended but AI now detects emergency, reopen/allow conversation ---

        // Append to history only if allowed (this implements your requirement)
        // push user message then model response
        chats.history.push({ role: 'user', parts: [{ text: message }] });
        chats.history.push({
            role: 'model',
            parts: [{ text: botResponseText }],
            suggestedReplies: parsedResponse.suggestedReplies,
            requiresNumericalInput: parsedResponse.requiresNumericalInput,
        });

        // if (chats.isEmergency && chats.isEnd) { // New emergency
        //     canPatientEndSession = false; // Override end signal
        // } else if (chats.isEmergency) { // Existing emergency
        //     canPatientEndSession = false; // Override end signal
        // }

        // Add new messages to chat history
        // if (chats.isEmergency || !canPatientEndSession) {
        //     chats.history.push({ role: 'user', parts: [{ text: message }] });
        //     chats.history.push({ role: 'model', parts: [{ text: botResponseText }] });
        // }

        const data = {
            role: 'bot',
            message: botResponseText,
            suggestedReplies: parsedResponse.suggestedReplies,
            requiresNumericalInput: parsedResponse.requiresNumericalInput,
        }
        // ioInstance().in(userId.toString()).allSockets().then(sockets => {
        // console.log(`Room ${userId} currently has sockets:`, Array.from(sockets));
        // });
        // console.log("Emitting botReply to", userId.toString(), "payload:", botResponseText);
        ioInstance().to(userId.toString()).emit("botReply", data);

        if (parsedResponse.isEnd) {
            chats.isEndBot = true;
        }

        // Handle summaries if conversation ends
        if (chats.isEndBot && (chats.chatbotType === 'emergency' || 'journal')) { // This isEnd needs to be true, then only the chats.isEnd will be checked. eg: even if isEnd is true, chats.End condition will not allow the user to make any more responses. (chats.isEnd is specified inside the else if condition )
            let summary = null;
            if (!chats.isEnd && chats.chatbotType === 'emergency') {
                console.log("Conversation has ended, so creating emergency summary");
                let emergencySummarybot;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        console.log(`Chatbot API attempt ${attempt}/${maxRetries}...`);
                        emergencySummarybot = await ai.models.generateContent({
                            model: "gemini-2.0-flash",
                            contents: JSON.parse(JSON.stringify(chats.history)),
                            config: {
                                systemInstruction: emergencySummarybotPrompt,
                                responseMimeType: "application/json",
                                responseSchema: emergencySummarybotSchema
                            }
                        });
                        // If successful, break the loop
                        break;
                    } catch (error) {
                        console.error(`Chatbot API attempt ${attempt} failed:`, error.message);
                        lastError = error;
                        if (attempt === maxRetries) {
                            console.error("All retry attempts failed for chatbot.");
                            throw lastError; // Throw the last error to be caught by outer try...catch
                        }
                        // Wait for the delay before retrying
                        await delay(retryDelayMs);
                    }
                }

                chats.isEnd = true;
                chats.isEndBot = false;
                console.log("chats.isEnd is: ", chats.isEnd);
                summary = JSON.parse(emergencySummarybot.text);
                emitSummary(userId, summary, relationship);
                console.log("successfully created emergency summary:", JSON.parse(emergencySummarybot.text));
            } else if (!chats.isEnd && chats.chatbotType === 'journal') {
                // Run this code if conversation has NOT ended. Then flag it has ended. So since we flag it as ended, next time this code wont run because conversation HAS ended.
                console.log("jounaling conversation has ended, so creating normal summary");
                let journalSummarybot;

                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        console.log(`Chatbot API attempt ${attempt}/${maxRetries}...`);
                        journalSummarybot = await ai.models.generateContent({
                            model: "gemini-2.0-flash",
                            contents: JSON.parse(JSON.stringify(chats.history)),
                            config: {
                                systemInstruction: journalSummarybotPrompt,
                                responseMimeType: "application/json",
                                responseSchema: journalSummarybotSchema
                            }
                        });
                        // If successful, break the loop
                        break;
                    } catch (error) {
                        console.error(`Chatbot API attempt ${attempt} failed:`, error.message);
                        lastError = error;
                        if (attempt === maxRetries) {
                            console.error("All retry attempts failed for chatbot.");
                            throw lastError; // Throw the last error to be caught by outer try...catch
                        }
                        // Wait for the delay before retrying
                        await delay(retryDelayMs);
                    }
                }
                chats.isEnd = true; // This will prevent any further user responses because even if isEnd = true, !chats.isEnd = false "always... after making the furst summary"
                chats.isEndBot = false;
                console.log("chats.isEnd is: ", chats.isEnd);
                summary = JSON.parse(journalSummarybot.text);
                emitSummary(userId, summary, relationship);
                console.log("journal summary created successfully ", JSON.parse(journalSummarybot.text));

            }
        }

        // Save updated chat (this will now save the sticky isEmergency flag)
        await chats.save();
        console.log("chat history saved, now total length is: ", chats.history.length);

    } catch (error) {
        ioInstance().to(userId.toString()).emit("botError", error);
        console.error("error in chatAgent function: ", error);
    }
};
