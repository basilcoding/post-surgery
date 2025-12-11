import { GoogleGenAI } from "@google/genai";

import { ioInstance } from "../../lib/socket.js";
import { sendMail } from '../../lib/email.js'

import Chatbot from '../../models/chatbot.model.js';
import PatientProfile from '../../models/patientProfile.model.js'
import CareCheckList from '../../models/careCheckList.model.js'
import BotSummary from "../../models/botsummary.model.js";

import { emitSummary } from "./emitSummary.util.js";

import { formatTimestampLabel } from "../timeUtils/formatTimestampLabel.js";
import { relativeAgeLabel } from "../timeUtils/relativeAgeLabel.js";

import {
    journalChatbotPrompt,
    symptomCheckChatbotPrompt,
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
import { formatOldSummary } from "./formatOldSummary.js";

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

// 3)
function toIso(ts) {
    try { return (ts instanceof Date) ? ts.toISOString() : new Date(ts).toISOString(); }
    catch { return new Date().toISOString(); }
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
        const recentHistory = getRecentHistory(chats.history, 100);

        const now = new Date();
        const isoNow = now.toISOString();
        const nowForAges = new Date();
        const formattedNow = formatTimestampLabel(now); // e.g. "[7:29 AM, Nov 8 2025]"

        const cleanedHistory = recentHistory.map(msg => {
            const ts = msg.timestamp ? msg.timestamp : nowForAges; // msg.timestamp is a Date (you store Date)
            const formatted = formatTimestampLabel(ts);
            return {
                role: msg.role,
                parts: (msg.parts || []).map(p => ({
                    text: p.text,
                })),
                // formattedTimestamp: formatted,
                age: relativeAgeLabel(msg.timestamp, nowForAges),
            };
        });

        const chatbotContext = [
            ...cleanedHistory,
            {
                role: "user",
                parts: [{ text: message }],
                // messageTimestamp: toIso(now),
                // formattedTimestamp: formattedNow,
                age: "now",
            }
        ];
        console.log('chatbot context is: ', chatbotContext)


        const patientMedicalHistory = formatMedicalHistory(patientProfile);
        const surgeryChecklist = formatSurgeryChecklist(protocol);

        // MAKE LOCAL VARIABLE, IMPORTANT: Dont do chatbotPrompt += patientMedicalHistory !!! Users data will get mixed up!! It will keep growing indefinitely by appending to the same variable during every request!! Never modify an imported variable!!
        let fullSystemPrompt;
        if (chatbotType === 'journal') {
            fullSystemPrompt = journalChatbotPrompt + patientMedicalHistory + surgeryChecklist;
            // console.log('Chatbot prompt is: ', fullSystemPrompt);
        } else if (chatbotType === 'SymptomCheck') {
            fullSystemPrompt = symptomCheckChatbotPrompt + patientMedicalHistory;
            // console.log('Chatbot prompt is: ', fullSystemPrompt);
        } else {
            fullSystemPrompt = generalChatbotPrompt + patientMedicalHistory + surgeryChecklist;
        }
        console.log("Full system prompt is: ", fullSystemPrompt);
        let chatbotResponse;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Chatbot API attempt ${attempt}/${maxRetries}...`);
                chatbotResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
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


        // push user message with timestamp
        chats.history.push({
            role: 'user',
            parts: [{ text: message }], // optional per-part timestamp
            timestamp: now, // message-level timestamp (Date)
        });

        // push model reply with timestamp
        chats.history.push({
            role: 'model',
            parts: [{ text: botResponseText }],
            suggestedReplies: parsedResponse.suggestedReplies,
            requiresNumericalInput: parsedResponse.requiresNumericalInput,
            timestamp: now,
        });

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
        if (chats.isEndBot && (chats.chatbotType !== 'general')) { // This isEnd needs to be true, then only the chats.isEnd will be checked. eg: even if isEnd is true, chats.End condition will not allow the user to make any more responses. (chats.isEnd is specified inside the else if condition )
            let summary = null;
            if (!chats.isEnd && chats.chatbotType === 'journal') {
                // console.log("Conversation has ended, so creating emergency summary");
                // inside the end-of-conversation block
                const recentHistoryForSummaryBot = getRecentHistory(chats.history, 100);
                const nowForAgesForSummaryBot = new Date();
                // const messageTsIso = msg.timestamp ? toIso(msg.timestamp) : toIso(nowForAges);
                const cleanedHistoryForSummaryBot = recentHistoryForSummaryBot.map(msg => {
                    const ts = msg.timestamp ? msg.timestamp : nowForAgesForSummaryBot; // msg.timestamp is a Date (you store Date)
                    // const formatted = formatTimestampLabel(ts);
                    return {
                        role: msg.role,
                        parts: (msg.parts || []).map(p => ({ text: p.text })),
                        // messageTimestamp: msg.timestamp ? toIso(msg.timestamp) : toIso(nowForAgesForSummaryBot)
                        // formattedTimestamp: formatted,
                        age: relativeAgeLabel(msg.timestamp || nowForAgesForSummaryBot, nowForAgesForSummaryBot),
                    };
                });

                const chatbotContextForSummaryBot = [
                    ...cleanedHistoryForSummaryBot
                ];
                console.log('chatbot context for summary bot is: ', chatbotContextForSummaryBot);

                const now = new Date();

                // Get the time exactly 24 hours ago from this moment

                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                let oldSummary = await BotSummary.findOne({ user: userId, assignedDoctor: relationship.doctor._id, createdAt: { $gte: twentyFourHoursAgo } })
                console.log('[emitSummary] oldSummary found?', !!oldSummary);


                let fullSummarybotPrompt;
                if (oldSummary) {
                    // Build final system instruction
                    const oldSummaryContext = formatOldSummary(oldSummary);
                    fullSummarybotPrompt = journalSummarybotPrompt + oldSummaryContext;
                } else {
                    fullSummarybotPrompt = journalSummarybotPrompt;
                }
                console.log('fullSummarybotPrompt is: ', fullSummarybotPrompt);

                let journalSummarybot;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        console.log(`Chatbot API attempt ${attempt}/${maxRetries}...`);
                        journalSummarybot = await ai.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: chatbotContextForSummaryBot,
                            config: {
                                systemInstruction: fullSummarybotPrompt,
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

                // chats.isEnd = true;
                chats.isEndBot = false;
                // console.log("chats.isEnd is: ", chats.isEnd);
                summary = JSON.parse(journalSummarybot.text);
                emitSummary(userId, summary, oldSummary, relationship, patientProfile, formattedNow);
                console.log("successfully created emergency summary:", JSON.parse(journalSummarybot.text));
            }
        }


        await chats.save();
        console.log("chat history saved, now total length is: ", chats.history.length);

    } catch (error) {
        ioInstance().to(userId.toString()).emit("botError", error);
        console.error("error in chatAgent function: ", error);
    }
};
