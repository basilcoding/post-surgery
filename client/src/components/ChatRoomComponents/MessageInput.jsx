// src/components/MessageInput/MessageInput.jsx
import React, { useRef, useState } from 'react';
import { X, Image, Send } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore.js';
import { toast } from 'react-hot-toast';

const MessageInput = () => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null); // base64 preview only for UI
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const { sendMessage, selectedUser, currentRoomId } = useChatStore();

  // keep for UI preview only
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    const preview = await toBase64(selectedFile);
    setImagePreview(preview);
    setFile(selectedFile);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('text', text);
      formData.append('receiverId', selectedUser?._id || '');
      if (file) formData.append('image', file);

      // Defensive debug: log entries so you can confirm we're sending a File
      for (const pair of formData.entries()) {
        // image should show a File object in console
        console.log('FormData entry:', pair[0], pair[1]);
      }

      // Clear UI optimistically (you can also wait for response if you prefer)
      setText('');
      setImagePreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await sendMessage(currentRoomId, formData);

    } catch (err) {
      console.error(err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type your message here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />

          {/* hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${imagePreview ? 'text-emerald-500' : 'text-zinc-400'}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={( !text.trim() && !imagePreview ) || sending}
          aria-label="Send message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
