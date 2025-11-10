import multer from 'multer';

// 1. Define the storage engine
const storage = multer.memoryStorage();

// 2. Set file size limit to prevent memory overflow (e.g., 5MB)
const limits = {
    fileSize: 5 * 1024 * 1024, // 5 megabytes
};

// 3. Initialize multer with the storage and limits
const upload = multer({
    storage: storage,
    limits: limits
});

// Define the specific fields you will accept
export const profileUploadConfig = upload.fields([
    { name: 'profilePic', maxCount: 1 },  // Will accept 1 file in a field named 'profilePic'
]);

// export default upload;