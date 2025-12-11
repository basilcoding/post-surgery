import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/useAuthStore";
import { useChatbotStore } from "../../store/useChatbotStore";

import { Image, Send } from 'lucide-react'

export default function JournalbotPage() {
    const { authUser, socket, subscribeToSelfRoom } = useAuthStore();
    const [userId] = useState(authUser?._id);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const { messages, getChatbotMessages, sendMessage, isLoading, connectChatbotSocketListeners, disconnectChatbotSocketListeners } = useChatbotStore();

    useEffect(() => {
        getChatbotMessages('journal');
        if (!socket) return;
        return () => disconnectChatbotSocketListeners(socket);
    }, []);

    useEffect(() => {
        subscribeToSelfRoom();
        if (socket) connectChatbotSocketListeners(socket);
    }, [subscribeToSelfRoom, socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (message) => {
        if (!message || !message.toString().trim()) return;
        await sendMessage(message.toString(), 'journal');
        setInput("");
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSendMessage(input, 'journal');
    };

    return (
        // Changed h-screen to h-[100dvh] for better mobile browser support
        <div className="h-[100dvh] w-full pt-[61px] bg-base-300 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-3 pt-3 md:px-6 md:py-4 text-white flex items-center justify-between flex-shrink-0 shadow-sm">
                <div>
                    <div className="font-bold text-base md:text-lg">Virtual Health Assistant</div>
                    <div className="text-xs">
                        <span className={`${socket?.connected ? 'text-green-400' : 'text-red-400'}`}>
                            {socket?.connected ? 'Available' : 'Offline'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="cursor-pointer text-xs md:text-sm px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 transition-colors"
                        onClick={() => { navigate('/patient/view-journals') }}
                    >
                        <Image size={18} />
                        {/* Responsive text: Short on mobile, full on desktop */}
                        <span className="hidden sm:inline">Upload Image After Finishing Your Journal</span>
                        <span className="inline sm:hidden">Upload Image</span>
                    </button>
                </div>
            </div>

            {/* Message container */}
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 flex flex-col-reverse space-y-4 space-y-reverse scrollbar-hide">
                {isLoading && <div className="text-gray-400 text-sm ml-2">typing...</div>}
                {(messages || []).slice().reverse().map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            // Adjusted max-width for mobile (85%) vs desktop (65%)
                            className={`px-4 py-3 rounded-2xl md:rounded-3xl max-w-[85%] md:max-w-[65%] text-left text-sm md:text-base ${msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-black/7 text-gray-800'
                                }`}
                        >

                            <div className="break-words">{msg.message}</div>

                            {/* Suggested replies */}
                            {msg.role !== 'user' && Array.isArray(msg.suggestedReplies) && msg.suggestedReplies.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {msg.suggestedReplies.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(opt)}
                                            className="cursor-pointer text-left px-3 py-2 rounded-2xl border border-black/10 bg-white/80 hover:bg-gray-100 shadow-sm text-xs md:text-sm transition-colors"
                                        >
                                            <span className="mr-1">→</span>{opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Numerical options */}
                            {msg.requiresNumericalInput && (
                                <div className="mt-4 w-full">
                                    {/* Changed to flex-wrap with gap: 
            This allows buttons to flow naturally like 'tags' or 'chips' 
            instead of forcing a rigid grid that breaks on mobile.
        */}
                                    <div className="flex flex-wrap justify-start">
                                        {Array.from({ length: 11 }, (_, num) => (
                                            <button
                                                key={num}
                                                onClick={() => handleSendMessage(num)}
                                                // Mobile friendly changes:
                                                // 1. Individual buttons (rounded-lg, shadow-sm) instead of a merged bar.
                                                // 2. w-10 h-10: Large comfortable touch target for thumbs.
                                                // 3. border-gray-200: Subtle border for each item.
                                                className="cursor-pointer w-10 h-10 flex items-center justify-center text-sm font-semibold rounded-sm border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors active:scale-95"
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>
            <div ref={messagesEndRef}></div>


            {/* Input bar */}
            <div className="p-2 md:p-3 bg-base-300 flex-shrink-0">
                <div className="bg-white flex items-center gap-2 rounded-3xl md:rounded-4xl pr-2 shadow-lg">
                    <input
                        type="text"
                        // text-base prevents iOS from zooming in when typing
                        className="flex-1 rounded-l-3xl md:rounded-l-4xl p-3 md:p-4 focus:outline-none bg-white text-black placeholder:text-gray-500 text-base"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />

                    <button
                        type="submit"
                        className="btn btn-circle btn-sm md:btn-lg bg-blue-500 hover:bg-blue-600 border-none text-white shadow-sm my-1"
                        onClick={() => handleSendMessage(input)}
                    >
                        <Send size={20} className="ml-0.5" />
                    </button>
                </div>
            </div>

        </div >
    );
}