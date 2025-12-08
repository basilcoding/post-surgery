import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { useAuthStore } from './useAuthStore';
import { useUserStore } from './useUserStore';

export const useChatbotStore = create((set, get) => ({
    // messages: [{ role: "bot", message: "Ready to start your questionare? Please give the responses in detail so I can give the best description about your well being to the doctor." }],
    messages: [],
    isLoading: false,

    connectChatbotSocketListeners: (socket) => {
        if (!socket) return;
        // remove any previous listeners to avoid duplicates
        socket.off('botReply');
        socket.off('botError');

        socket.on("botReply", (data) => {
            // console.log("[socket] botReply received:", data);
            console.log("[socket] prev messages:", get().messages);
            set((prev) => ({
                messages: [...(prev.messages || []), data] // safely append, even if messages was cleared or undefined
            }));
            set({ isLoading: false })
            // console.log("[socket] after set (get):", get().messages);
        });

        socket.on('botError', (error) => {
            set((prev) => ({
                messages: [...(prev.messages || []), { role: 'bot', message: 'Oops! Something went wrong.' }],
            }));
            set({ isLoading: false })
            console.error('Bot error from server:', error);
        });
    },

    disconnectChatbotSocketListeners: (socket) => {
        if (!socket) return;
        socket.off('botReply');
        socket.off('botError');
    },

    getChatbotMessages: async (chatbotType) => {
        const { authUser } = useAuthStore.getState();
        try {
            const res = await axiosInstance.get(`/chatbot/message/${authUser._id}`,
                {
                    params: { chatbotType: chatbotType },
                },
            )
            const msgs = Array.isArray(res?.data?.messages) ? res.data.messages : [];
            if (chatbotType === 'journal') {
                set({
                    messages: [
                        {
                            role: "bot",
                            message: "Ready to start your questionare? Please give the responses in detail so I can give the best description about your well being to the doctor.",
                            suggestedReplies: [
                                "Yes, I'm ready. I'll try to describe everything as clearly as I can.",
                                "Sure, let's begin.",
                                "I don't feel very good.",
                                "I'm in great pain.",
                            ]


                        }, ...msgs],
                });
            } else {
                set({
                    messages: [
                        {
                            role: "bot",
                            message: "Please tell me your query.",
                            suggestedReplies: [
                                "I have symptom I would like some insight about from the doctor.",
                                "I've been feeling a few changes lately that I'd like to share.",
                                "I dont feel very good.",
                                "I'm in great pain."
                            ]


                        }, ...msgs],
                });
            }
        } catch {
            set((prev) => ({
                messages: [...(prev.messages || []), { role: 'bot', message: 'Oops! Something went wrong.' }],
            }));
        }
    },

    sendMessage: async (input, chatbotType) => {
        if (!input.trim()) return;
        const userMessage = { role: "user", message: input.trim() };
        set((prev) => ({
            messages: [...(prev.messages || []), userMessage]
        }))

        set({ isLoading: true });

        const { userProfile } = useUserStore.getState();
        try {
            const res = await axiosInstance.post("/chatbot/message",
                {
                    message: input.trim(),
                    activeDoctor: userProfile?.activeDoctor,
                    patientId: userProfile?.patientId,
                },
                {
                    params: { chatbotType: chatbotType },
                });
            // NOT pushing bot reply here, server will emit it via socket and the listener will add it.
        } catch {
            set((prev) => ({
                messages: [...(prev.messages || []), { role: 'bot', message: 'Oops! Something went wrong.' }],
            }));
            set({ isLoading: false })
        }
    },

}));