import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import path from 'path';

import { initSocket } from './lib/socket.js';
import { transporter } from './lib/email.js';
import { connectDB } from './lib/db.js'

import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import adminRoutes from './routes/admin.route.js';
import chatbotRoutes from './routes/chatbot.route.js';
import userRoutes from './routes/user.route.js';
import summaryRoutes from './routes/summary.route.js';
import relationshipRoutes from './routes/relationships.route.js';
import patientRoutes from './routes/patient.route.js';
import profileRoutes from './routes/profile.route.js';
import careCheckListRoutes from './routes/careCheckList.route.js'
import appointmentRoutes from './routes/appointment.route.js'

dotenv.config();

const __dirname = path.resolve();

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true, // allow cookie headers to be sent with the req object
}));
app.use(cookieParser()); // parse the cookie header from incoming requests(cookie-parser essentially looks at the Cookie header) and make them accessible under req.cookies

// initialize socket.io
initSocket(server); // pass http server

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/users', userRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/care-check-lists', careCheckListRoutes);
app.use('/api/appointments', appointmentRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    })
}

// Use an async function to control startup order
// const startServer = async () => {
//     try {
//         // 1. Connect to the database first
//         await connectDB();

//         // 2. If the connection is successful, then start the server
//         const PORT = process.env.PORT || 5000;
//         server.listen(PORT, () => {
//             console.log(`Listening on port ${PORT}`);
//         });

//     } catch (error) {
//         console.error("Failed to connect to the database", error);
//         process.exit(1); // Exit if the DB connection fails
//     }
// };

// startServer();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    connectDB();
    console.log(`Listening on port ${PORT}`)
})