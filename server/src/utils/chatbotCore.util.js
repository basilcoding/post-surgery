import { GoogleGenAI } from "@google/genai";

import Chatbot from '../models/chatbot.model.js';
import Relationship from "../models/relationship.model.js";

import { emitSummary } from "./emitSummary.util.js";

import { ioInstance } from "../lib/socket.js";

import {
    stopAndEmergencyResponsePrompt,
    emergencyConversationBotPrompt,
    emergencySummaryBotPrompt,
    conversationBotResponsePrompt,
    journalSummaryBotPrompt
} from './chatbotPrompts.util.js';

import {
    stopAndEmergencyResponseSchema,
    emergencySummaryBotSchema,
    journalSummaryBotSchema
} from './chatbotResponseSchema.util.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getRecentHistory(history, n = 8) {
    return Array.isArray(history) ? history.slice(-n) : [];
}

export const chatbot = async function (userId, message, isEnd, req, res) {
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

        // if it is NOT an emergency and if the conversation has NOT ended, THEN only... run the below code
        if (!chats.isEmergency && !chats.isEnd) { // if conversation has ended after normalJournal conversation i dont want the stopAndEmergencyBot to run.
            console.log("checking if its an emergency");
            const contextForEmergency = getRecentHistory(chats.history, 4);
            const emergencyCheckContents = [
                ...JSON.parse(JSON.stringify(contextForEmergency)),
                { role: "user", parts: [{ text: message }] }
            ];

            const stopAndEmergencyResponse = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: emergencyCheckContents,
                config: {
                    systemInstruction: stopAndEmergencyResponsePrompt,
                    responseMimeType: "application/json",
                    responseSchema: stopAndEmergencyResponseSchema
                }
            });

            const parsedEmergency = JSON.parse(stopAndEmergencyResponse.text);
            console.log("emergency checking bots result: ", parsedEmergency);

            // Only update if the check detects a new emergency
            if (parsedEmergency.isEmergency) {
                chats.isEmergency = true;
                console.log("its an emergency, now emergency state wont change");
            }
        } else {
            console.log("its aldready an emergency so not checking if its an emergency");
        }

        //Prepare conversation context
        const recentHistory = getRecentHistory(chats.history, 8);
        const conversationContents = [
            ...JSON.parse(JSON.stringify(recentHistory)), // dont get confused, this .stringify will remove all the object id stuff (meta data) of the data that is retrieved and make it (parse it)
            { role: "user", parts: [{ text: message }] }
        ];

        // choose the systemInstruction including metadata
        // i'm thinking , this line isEndSignal=${isEnd} is not necessary to add in as metadata, if it proves to be wrong, we could add it later
        const systemInstruction = chats.isEmergency
            ? `${emergencyConversationBotPrompt}\nMetadata: isEmergencyState=${chats.isEmergency} isEnd=${chats.isEnd}`
            : `${conversationBotResponsePrompt}\nMetadata: isEmergencyState=${chats.isEmergency} isEnd=${chats.isEnd}`;

        console.log(`the prompt used is '${chats.isEmergency ? "Emergency" : "Normal"}' prompt`);

        // Generate AI response
        const conversationResponse = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: conversationContents,
            config: { systemInstruction }
        });

        const botResponseText = conversationResponse.text;
        console.log("bot response is: ", botResponseText);

        // Add new messages to chat history
        chats.history.push({ role: 'user', parts: [{ text: message }] });
        chats.history.push({ role: 'model', parts: [{ text: botResponseText }] });

        // Handle summaries if conversation ends
        if (isEnd) { // This isEnd needs to be true, then only the chats.isEnd will be checked. eg: even if isEnd is true, chats.End condition will not allow the user to make any more responses. (chats.isEnd is specified inside the else if condition )
            let summary = null;
            if (chats.isEmergency && !chats.isEnd) { // run this code if it is IS AN EMERGENCY and if conversation has NOT ALDREADY ENDED
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
                summary = JSON.parse(emergencySummaryBot.text);
                emitSummary(userId, chats, summary);
                console.log("successfully created emergency summary:", JSON.parse(emergencySummaryBot.text));
            } else if (!chats.isEnd) {
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
                emitSummary(userId, chats, summary);
                console.log("journal summary created successfully ", JSON.parse(journalSummaryBot.text));
                chats.isEnd = true; // This will prevent any further user responses because even if isEnd = true, !chats.isEnd = false "always... after making the furst summary"
            }
        }

        // Save updated chat (this will now save the sticky isEmergency flag)
        await chats.save();
        console.log("chat history saved, now total length is: ", chats.history.length);



        // Send response to client
        return res.json({ message: botResponseText });

    } catch (err) {
        console.error("error in chatAgent function: ", err);
    }
};
