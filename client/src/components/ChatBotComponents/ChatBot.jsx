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
        <div className="w-full h-[calc(100vh_-_65px)] bg-base-300 flex flex-col">
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

            {/* Messages section (start from bottom) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col-reverse space-y-4 space-y-reverse scrollbar-hide">
                <div ref={messagesEndRef} />
                {(messages || []).slice().reverse().map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`px-4 py-3 rounded-3xl max-w-[65%] text-left ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                        >
                            <div>{msg.message}</div>

                            {/* Bot options in one column */}
                            {msg.role !== 'user' && Array.isArray(msg.suggestedReplies) && msg.suggestedReplies.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {msg.suggestedReplies.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(opt)}
                                            className="text-left px-3 py-2 rounded-lg border border-black-800 bg-white/80 hover:bg-gray-200 shadow-sm hover:cursor-pointer"
                                        >
                                            <span>--{">"}    </span>{opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {/* Numerical input row (0–10 boxes) */}
                            {msg.requiresNumericalInput && (
                                <div className="mt-3 w-fit flex bg-white/80 border border-black-100 rounded-md">
                                    {Array.from({ length: 11 }, (_, num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleSendMessage(num)}
                                            className="w-[30px] h-[30px] bg-white/80 hover:bg-gray-200 text-black text-sm font-semibold flex items-center justify-center hover:cursor-pointer rounded-md"
                                            style={{ margin: 0, padding: 0 }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-gray-400 text-sm">typing...</div>}
            </div>

            {/* Input bar */}
            <div className="m-3 bg-white flex items-center gap-3 rounded-4xl">
                <input
                    type="text"
                    className="flex-1 rounded-4xl p-3 focus:outline-none bg-white text-black placeholder:text-gray-600"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    onClick={() => handleSendMessage(input)}
                    className="bg-blue-600 text-white px-5 py-3 rounded-r-4xl hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
}