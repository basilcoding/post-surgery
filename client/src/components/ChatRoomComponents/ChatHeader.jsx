import { X } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useEffect } from "react";

const ChatHeader = () => {
    const { selectedUser, setSelectedUser, unsubscribeFromMessages, currentRoomId, endConversation } = useChatStore();
    const { onlineUsers } = useAuthStore();

    // useEffect(() => {
    //     if (!currentRoomId) return;
    //     getOnlineUsers(currentRoomId);
    // }, [currentRoomId, selectedUser]);

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                        </div>
                    </div>

                    {/* User info */}
                    <div>
                        <h3 className="font-medium">{selectedUser.fullName}</h3>
                        <p className="text-sm text-base-content/70">
                            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>
                {/* Close button */}
                {selectedUser.role !== 'doctor' && (
                    <button className='hover:bg-base-300 rounded-full p-1'
                        onClick={() => {
                            // unsubscribeFromMessages(); // dangerous don't use here haha
                            endConversation();
                        }}>
                        <X />End
                    </button>
                )}
            </div>
        </div >
    );
};
export default ChatHeader;