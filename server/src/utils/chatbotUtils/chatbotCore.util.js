import { GoogleGenAI } from "@google/genai";

import Chatbot from '../../models/chatbot.model.js';

import { emitSummary } from "./emitSummary.util.js";

import { ioInstance } from "../../lib/socket.js";

import {
    chatbotPrompt,
    emergencySummaryBotPrompt,
    journalSummaryBotPrompt,
    
} from './chatbotPrompts.util.js';

import {
    chatbotResponseSchema,
    emergencySummaryBotSchema,
    journalSummaryBotSchema
} from './chatbotResponseSchema.util.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getRecentHistory(history, n = 16) {
    return Array.isArray(history) ? history.slice(-n) : [];
}

export const chatbot = async function (userId, message, isEnd, relationship) {
    try {
        console.log("\nchatAgent called successfully called");
        console.log(`userId: ${userId}, Message: "${message}", isEnd: ${isEnd}`);

        // Load chat from DB or create a new one
        let chats = await Chatbot.findOne({ userId });

        if (!chats) {
            chats = new Chatbot({ userId });
            console.log("creating new record.");
        } else {
            console.log(`found a chat. length is ${chats.history.length}`);
        }

        console.log("checking if its an emergency");
        const recentHistory = getRecentHistory(chats.history, 50);
        const chatbotContext = [
            ...JSON.parse(JSON.stringify(recentHistory)),
            { role: "user", parts: [{ text: message }] }
        ];

        // let chatbotPrompt = ; // choose the systemInstruction including metadata
        // let promptType = ''; // For logging
        // if (chats.isEnd) {
        //     chatbotPrompt = `${postSessionPrompt}\nMetadata: isEmergencyState=${chats.isEmergency} isEnd=${chats.isEnd}`;
        //     promptType = 'Post-Session';
        // } else if (chats.isEmergency) {
        //     chatbotPrompt = `${emergencyConversationBotPrompt}\nMetadata: isEmergencyState=${chats.isEmergency} isEnd=${chats.isEnd}`;
        //     promptType = 'Emergency';
        // } else {
        //     chatbotPrompt = `${conversationBotResponsePrompt}\nMetadata: isEmergencyState=${chats.isEmergency} isEnd=${chats.isEnd}`;
        //     promptType = 'Normal';
        // }

        // console.log(`the prompt used is '${promptType}' prompt`);

        const chatbotResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: chatbotContext,
            config: {
                systemInstruction: chatbotPrompt,
                responseMimeType: "application/json",
                responseSchema: chatbotResponseSchema
            }
        });

        const parsedResponse = JSON.parse(chatbotResponse.text);
        console.log("emergency checking bots result: ", parsedResponse);

        const botResponseText = parsedResponse.botResponse;
        console.log("bot response is: ", botResponseText);

        const aiDetectedEmergency = parsedResponse.isEmergency;

        // --- Key logic: if chat was ended but AI now detects emergency, reopen/allow conversation ---
        let allowAppendToHistory = false;
        console.log("The value of chats.isEnd is: ", chats.isEnd);
        if (chats.isEnd) {
            // chat was previously ended
            if (aiDetectedEmergency) {
                // reopen conversation for emergency
                chats.isEmergency = true;     // set emergency
                chats.isEnd = false;         // reopen so we WILL append and continue
                allowAppendToHistory = true; // allow history update for this emergency message
                console.log("Chat was ended but AI detected new emergency so reopening chat and recording emergency.");
            } else {
                // chat ended and no emergency detected -> do NOT append history
                allowAppendToHistory = false;
                console.log("Chat is ended and AI did not detect emergency so not appending to the history.");
            }
        } else {
            // chat not ended: normal flow
            // preserve emergency flag if previously true, or set if AI says so
            chats.isEmergency = aiDetectedEmergency;
            allowAppendToHistory = true;
        }

        // Append to history only if allowed (this implements your requirement)
        if (allowAppendToHistory) {
            // push user message then model response
            chats.history.push({ role: 'user', parts: [{ text: message }] });
            chats.history.push({ role: 'model', parts: [{ text: botResponseText }] });
        }

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
            message: botResponseText
        }
        // console.log("Emitting botReply to", userId, "payload:", botResponseText);
        ioInstance().to(userId.toString()).emit("botReply", data);

        if (parsedResponse.isEnd) {
            chats.isEndBot = true;
        }

        // Handle summaries if conversation ends
        if (isEnd) { // This isEnd needs to be true, then only the chats.isEnd will be checked. eg: even if isEnd is true, chats.End condition will not allow the user to make any more responses. (chats.isEnd is specified inside the else if condition )
            let summary = null;
            if (chats.isEmergency && chats.isEndBot && !chats.isEnd) { // run this code if it is IS AN EMERGENCY
                console.log("emergency conversation has ended, so creating emergency summary");
                const emergencySummaryBot = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: JSON.parse(JSON.stringify(chats.history)),
                    config: {
                        systemInstruction: emergencySummaryBotPrompt,
                        responseMimeType: "application/json",
                        responseSchema: emergencySummaryBotSchema
                    }
                });
                chats.isEnd = true;
                chats.isEndBot = false;
                summary = JSON.parse(emergencySummaryBot.text);
                emitSummary(userId, chats, summary, relationship);
                console.log("successfully created emergency summary:", JSON.parse(emergencySummaryBot.text));
            } else if (!chats.isEnd && chats.isEndBot) {
                // Run this code if conversation has NOT ended. Then flag it has ended. So since we flag it as ended, next time this code wont run because conversation HAS ended.
                console.log("jounaling conversation has ended, so creating normal summary");
                const journalSummaryBot = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: JSON.parse(JSON.stringify(chats.history)),
                    config: {
                        systemInstruction: journalSummaryBotPrompt,
                        responseMimeType: "application/json",
                        responseSchema: journalSummaryBotSchema
                    }
                });
                summary = JSON.parse(journalSummaryBot.text);
                emitSummary(userId, chats, summary, relationship);
                console.log("journal summary created successfully ", JSON.parse(journalSummaryBot.text));
                chats.isEnd = true; // This will prevent any further user responses because even if isEnd = true, !chats.isEnd = false "always... after making the furst summary"
                chats.isEndBot = false;
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
