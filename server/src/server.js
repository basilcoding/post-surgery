import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import { initSocket } from './lib/socket.js';

import { connectDB } from './lib/db.js'
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import adminRoutes from './routes/admin.route.js';
import chatbotRoutes from './routes/chatbot.route.js';
import userRoutes from './routes/user.route.js';
import summaryRoutes from './routes/summary.route.js';
import relationshipRoutes from './routes/relationships.route.js';
import patientRoutes from './routes/patient.route.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    connectDB();
    console.log(`Listening on port ${PORT}`)
})