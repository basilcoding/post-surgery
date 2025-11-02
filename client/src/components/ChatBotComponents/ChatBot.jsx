import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatbotStore } from "../../store/useChatbotStore";

export default function Chatbot() {
    const { authUser, socket, subscribeToSelfRoom } = useAuthStore();
    const [userId] = useState(authUser?._id);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const { messages, getChatbotMessages, sendMessage, isLoading, connectChatbotSocketListeners, disconnectChatbotSocketListeners } = useChatbotStore();

    useEffect(() => {
        getChatbotMessages();
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
        await sendMessage(message.toString());
        setInput("");
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") handleSendMessage(input);
    };

    return (
        <div className="w-full h-screen bg-primary flex flex-col">
            {/* Header */}
            <div className="bg-black-800 px-6 py-4 text-white flex items-center justify-between">
                <div>
                    <div className="font-bold text-lg">Virtual Health Assistant</div>
                    <div className="text-xs">
                        <span className={`${socket?.connected ? 'text-green-400' : 'text-red-400'}`}>
                            {socket?.connected ? 'Available' : 'Offline'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="text-sm px-3 py-2 rounded-lg bg-gray-800/30 text-white"
                        onClick={() => { }}
                    >
                        Chat option
                    </button>
                </div>
            </div>

            {/* Messages section */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {(messages || []).map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`px-4 py-3 rounded-xl max-w-[85%] text-left ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                        >
                            <div>{msg.message}</div>

                            {/* Bot options in one column */}
                            {msg.role !== 'user' && Array.isArray(msg.options) && msg.options.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {msg.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(opt.label ?? opt)}
                                            className="text-left px-3 py-2 rounded-lg border border-black-800 bg-white/80 hover:bg-white/100 shadow-sm"
                                        >
                                            {opt.label ?? opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && <div className="text-gray-400 text-sm">typing...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-black-800 bg-black-900 flex items-center gap-3">
                <input
                    type="text"
                    className="flex-1 rounded-l-xl p-3 focus:outline-none bg-transparent text-white placeholder:text-gray-400"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    onClick={() => handleSendMessage(input)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-r-xl hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
