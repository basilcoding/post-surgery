import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { axiosInstance } from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";

export default function Chatbot() {
    const { authUser } = useAuthStore();
    const [userId] = useState(authUser?._id);
    const [messages, setMessages] = useState([
        { role: "bot", message: "Hey There! Let's start your Questionnaire for today!" },
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [bubbleClicked, setBubbleClicked] = useState(false);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getChatbotMessages = async () => {
        try {
            const res = await axiosInstance.get(`/chatbot/message/${authUser._id}`)
            setMessages([...res.data.messages])
        } catch {
            setMessages(prev => [...prev, { role: "bot", message: "Oops! Something went wrong." }]);
        }
    }

    useEffect(() => {
        getChatbotMessages();
    }, [])

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMessage = { role: "user", message: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            console.log("Sending chatbot message for user:", userId);
            const res = await axiosInstance.post("/chatbot/message", {
                message: input.trim(),
            });

            const botReply = res.data.message || "(Bot didn’t reply)";
            setMessages(prev => [...prev, { role: "bot", message: botReply }]);
        } catch {
            setMessages(prev => [...prev, { role: "bot", message: "Oops! Something went wrong." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    return (
        <>
            {/* AnimatePresence handles mounting/unmounting animations */}
            <AnimatePresence>
                {bubbleClicked && (
                    <motion.div
                        className="fixed right-4 bottom-18 z-50 pointer-events-auto" // <-- offset 20px to the right
                        initial={{ scale: 0, opacity: 0, originX: 1, originY: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0, originX: 1, originY: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <div className="flex flex-col w-[325px] h-[500px] bg-primary rounded-2xl shadow-lg overflow-hidden">
                            {/* Chat Header */}
                            <div className="bg-black-800 text-white px-4 py-3 font-bold rounded-2xl">
                                Please enter quit to finish and send...
                                Please Enter the responses in detail...
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className={`px-4 py-2 rounded-xl max-w-[85%] text-left ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
                                        >
                                            {msg.message}
                                        </motion.div>
                                    </div>
                                ))}
                                {isLoading && <div className="text-gray-500 text-sm">typing...</div>}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Field */}
                            <div className="p-3 border-t border-black-800 flex">
                                {/* remove border to keep the outlines away from the input */}
                                <input
                                    type="text"
                                    className="flex-1 focus:outline-none rounded-l-xl p-auto px-3 py-2 text-white focus:ring-0 focus:ring-black-800"
                                    placeholder="Type your message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                />
                                <button
                                    onClick={sendMessage}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-r-xl hover:bg-blue-700 transition"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* Floating Chat Button */}

            </AnimatePresence>



            <div
                className="fixed bottom-4 right-4 cursor-pointer w-16 h-16 flex items-center justify-center bg-primary text-white shadow-lg rounded-full z-50"
                onClick={() => setBubbleClicked(!bubbleClicked)}
            >
                {bubbleClicked ? "Close" : "Chat"}
            </div>

        </>
    );
}
