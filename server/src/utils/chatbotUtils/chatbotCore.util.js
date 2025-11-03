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
    summaryBotSchema
} from './chatbotResponseSchema.util.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getRecentHistory(history, n = 16) {
    return Array.isArray(history) ? history.slice(-n) : [];
}

export const chatbot = async function (userId, message, isEnd, relationship, chatbotType = 'journal') {
    try {
        console.log("\nchatAgent called successfully called");
        console.log(`userId: ${userId}, Message: "${message}", isEnd: ${isEnd}`);

        // Load chat from DB or create a new one
        let chats = await Chatbot.findOne({ userId, chatbotType: chatbotType });

        if (!chats) {
            chats = new Chatbot({ userId, chatbotType: chatbotType });
            console.log("creating new record.");
        } else {
            console.log(`found a chat. length is ${chats.history.length}`);
        }

        console.log("checking if its an emergency");
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
        // console.log("bot response is: ", botResponseText);

        // --- Key logic: if chat was ended but AI now detects emergency, reopen/allow conversation ---

        // Append to history only if allowed (this implements your requirement)
        // push user message then model response
        chats.history.push({ role: 'user', parts: [{ text: message }] });
        chats.history.push({ role: 'model', parts: [{ text: botResponseText }], suggestedReplies: parsedResponse.suggestedReplies });

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
        if (chats.isEndBot) { // This isEnd needs to be true, then only the chats.isEnd will be checked. eg: even if isEnd is true, chats.End condition will not allow the user to make any more responses. (chats.isEnd is specified inside the else if condition )
            let summary = null;
            console.log("Conversation has ended, so creating emergency summary");
            const summaryBot = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: JSON.parse(JSON.stringify(chats.history)),
                config: {
                    systemInstruction: emergencySummaryBotPrompt,
                    responseMimeType: "application/json",
                    responseSchema: summaryBotSchema
                }
            });
            chats.isEnd = true;
            chats.isEndBot = false;
            summary = JSON.parse(summaryBot.text);
            emitSummary(userId, chats, summary, relationship);
            console.log("successfully created emergency summary:", JSON.parse(summaryBot.text));
        }

        // Save updated chat (this will now save the sticky isEmergency flag)
        await chats.save();
        console.log("chat history saved, now total length is: ", chats.history.length);

    } catch (error) {
        ioInstance().to(userId.toString()).emit("botError", error);
        console.error("error in chatAgent function: ", error);
    }
};
