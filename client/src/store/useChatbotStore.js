import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

export const useChatbotStore = create((set, get) => ({
    // messages: [{ role: "bot", message: "Ready to start your questionare? Please give the responses in detail so I can give the best description about your well being to the doctor." }],
    messages: [],
    isLoading: false,

    connectChatbotSocketListeners: (socket) => {
        if (!socket) return;
        console.log('socket id for watson is:', socket)
        // remove any previous listeners to avoid duplicates
        socket.off('botReply');
        socket.off('botError');

        socket.on("botReply", (data) => {
            // console.log("[socket] botReply received:", data);
            // console.log("[socket] prev messages:", get().messages);
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

    getChatbotMessages: async () => {
        const { authUser } = useAuthStore.getState();
        try {
            const res = await axiosInstance.get(`/chatbot/message/${authUser._id}`)
            const msgs = Array.isArray(res?.data?.messages) ? res.data.messages : [];
            set({ messages: [{ role: "bot", message: "Ready to start your questionare? Please give the responses in detail so I can give the best description about your well being to the doctor." }, ...msgs], });
        } catch {
            set((prev) => ({
                messages: [...(prev.messages || []), { role: 'bot', message: 'Oops! Something went wrong.' }],
            }));
        }
    },

    sendMessage: async (input) => {
        if (!input.trim()) return;
        const userMessage = { role: "user", message: input.trim() };
        set((prev) => ({
            messages: [...(prev.messages || []), userMessage]
        }))

        set({ isLoading: true });

        try {
            const res = await axiosInstance.post("/chatbot/message", {
                message: input.trim(),
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