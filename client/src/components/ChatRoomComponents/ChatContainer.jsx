import { useChatStore } from '../../store/useChatStore';
import { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageSkeleton from '../skeletons/MessageSkeleton';
import { useAuthStore } from '../../store/useAuthStore';
import { formatMessageTime } from '../../lib/utils';

// VERY VERY VERY IMPORTANT NOTE TO UNDERSTAND...
// Best practice:
// Don’t persist messages in localStorage(too heavy, can go stale).
// Persist only roomId + selectedUser in localStorage, just enough context to restore the chat.
// Always fetch fresh messages from DB on reload(which is done with getMessages(currentRoomId)).

const ChatContainer = () => {
    const {
        messages,
        getMessages,
        isMessagesLoading,
        selectedUser,
        currentRoomId,
        subscribeToMessages,
        unsubscribeFromMessages,
        isRoomChecking
    } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (currentRoomId) {
            getMessages(currentRoomId); // room-based fetch
        }

        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [currentRoomId, isRoomChecking]);


    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-y-auto .hide-scrollbar">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`chat ${message.senderId === authUser._id ? 'chat-end' : 'chat-start'
                            }`}
                    >
                        <div className="chat-image avatar">
                            <div className="size-10 rounded-full border">
                                <img
                                    src={
                                        message.senderId === authUser._id
                                            ? authUser.profilePic || '/avatar.png'
                                            : selectedUser?.profilePic || '/avatar.png'
                                    }
                                    alt="profile pic"
                                />
                            </div>
                        </div>

                        <div className="chat-header mb-1">
                            <time className="text-xs opacity-50 ml-1">
                                {formatMessageTime(message.createdAt)}
                            </time>
                        </div>

                        <div className="chat-bubble flex flex-col">
                            {message.image && (
                                <img
                                    src={message.image}
                                    alt="image content"
                                    className="max-w-xs rounded-lg"
                                    onLoad={() =>
                                        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                                    }
                                />
                            )}
                            <div ref={messageEndRef} />

                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
                <div ref={messageEndRef} />
            </div>
            <MessageInput />
        </div>
    );
};

export default ChatContainer;
