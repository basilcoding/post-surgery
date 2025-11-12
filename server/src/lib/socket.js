import jwt from 'jsonwebtoken';
import cookie from 'cookie';

import { Server } from 'socket.io';

import User from '../models/user.model.js';
import DoctorProfile from "../models/doctorProfile.model.js";
import PatientProfile from "../models/patientProfile.model.js";

import { sendMail } from './email.js';

let io;
// const userSocketMap = {}; // {userId: socketId} (userId from database and socket.id from socket)

export function initSocket(server) {

    io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173"],
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            // Parse cookies from socket headers
            const cookies = socket.handshake.headers.cookie
                ? cookie.parse(socket.handshake.headers.cookie)
                : {};

            const token = cookies.jwt;
            if (!token) return next(new Error("Unauthorized - No Token"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return res.status(401).json({ message: 'Unauthorized - No Token Provided!' });
            }
            // const user = await User.findById(decoded.userId).select('-password'); // exclude the password field
            // if (!user) {
            //     return res.status(404).json({ message: 'User Not Found!' })
            // }

            socket.userId = decoded.userId;
            socket.role = decoded.role;
            socket.email = decoded.email;
            // if (socket.role === "doctor") {
            //     const docProfile = await DoctorProfile.findOne({ user: socket.userId }).select("currentRoomId");
            //     socket.currentRoomId = docProfile?.currentRoomId || null;
            // } else { // patient (or fallback)
            //     const patientProfile = await PatientProfile.findOne({ user: socket.userId }).select("currentRoomId");
            //     socket.currentRoomId = patientProfile?.currentRoomId || null;
            // }

            next();
        } catch (err) {
            next(new Error("Unauthorized - Invalid or Expired Token From Socket Middleware"));
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        const userId = socket.userId; // from the middleware above
        if (userId) {
            socket.join(userId.toString()); // make the user join the room with their own userId (ALERT! MAKE USERID AS STRING, THIS SMALL ISSUE WAS A BIG PROBLEM BECAUSE THE CHATBOTCOREUTIL FILE WILL BE EMITING TO room string formatted USERID).
        };

        socket.on("createRoom", async ({ inviteeId }) => {
            // console.log('createRoom event received with email:', inviteeEmail);
            if (socket.role !== 'doctor') {
                console.log("Create Room problem: Only doctors can create a room!")
                return res.status(400).json({ message: "Only Doctors are allowed to Create a Room!" })
            }
            const creator = await User.findById(socket.userId);
            const invitee = await PatientProfile.findOne({ patientId: inviteeId }).populate('user', '-password');
            if (!creator || !invitee) return;
            const roomId = `room_${Date.now()}`;

            // set server-side canonical state for authorization/chatroomAuthChecking
            const { doctor, patient } = await Promise.all([
                DoctorProfile.findOneAndUpdate({ user: socket.userId }, { currentRoomId: roomId }),
                PatientProfile.findOneAndUpdate({ user: invitee.user._id }, { currentRoomId: roomId })
            ]);

            io.to(invitee.user._id.toString()).socketsJoin(roomId); // Add *all sockets* in the invitee's personal room to the chat room
            io.to(creator._id.toString()).socketsJoin(roomId); // Add *all sockets* in the creator's personal room to the chat room

            // notify invitee and creator via their private userId room
            io.to(creator._id.toString()).emit("roomNotify", { roomId, otherUser: invitee.user });
            io.to(invitee.user._id.toString()).emit("roomNotify", { roomId, otherUser: creator });

            sendMail(invitee.user.email, 'ChatRoom Created', `This is to notify you that a chatroom has been created by your Doctor ${creator.fullName}. Please Join the Chatroom promptly to converse with the doctor.`)
        })

        // socket.on('getOnlineUsers', ({ roomId }) => {
        //     const getOnlineUsers = async () => {
        //         // Get all socket IDs in that room
        //         const sockets = await io.in(roomId).fetchSockets();
        //         // Each socket has .handshake.query.userId
        //         const userIds = sockets.map(s => s.handshake.query.userId);
        //         socket.emit('getOnlineUsers', userIds);
        //         console.log('online Users: ', [...userIds]);
        //     }
        //     getOnlineUsers();
        // })


        // End conversation (kick everyone out)
        socket.on("endRoom", async ({ roomId, creator, invitee }) => {
            // console.log(`(endRoom Event) Socket ${socket.id} ended room ${roomId}`);
            // io.to(roomId).emit("roomEnded", { roomId });
            const cookies = socket.handshake.headers.cookie
                ? cookie.parse(socket.handshake.headers.cookie)
                : {};
            const token = cookies.roomToken; //  read from cookies

            if (!token) {
                await Promise.all([
                    DoctorProfile.updateMany(
                        { currentRoomId: roomId },
                        { $set: { currentRoomId: null } }
                    ),
                    PatientProfile.updateMany(
                        { currentRoomId: roomId },
                        { $set: { currentRoomId: null } }
                    ),
                ])
            }
            io.to(creator?._id.toString()).emit("roomEnded", { roomId });
            io.to(invitee?._id.toString()).emit("roomEnded", { roomId });

            // when the doctor socket emits endRoom the below code will everyone's room id with doctors currentRoomId so when the protectRoom middleware runs, it will fail the check of -->is currentRoomId there in the db?<-- for both doctor and patient, so patient cant enter again once doctor has cancelled the room.

            io.socketsLeave(roomId);
        });

        socket.on("joinSelfRoom", async ({ roomId }) => {
            // console.log('subscribetoselfRoom called successfully!')
            if (!roomId) return;
            try {
                socket.join(roomId.toString());
                // console.log(`Socket ${socket.id} successfully joined authorized room ${roomId}`);
            } catch (error) {
                console.log(error);
            }
        })

        socket.on("joinRoom", async ({ roomId }) => {
            if (!roomId) return;

            try {
                // console.log('join room connection called succesfully')
                let profile;
                if (socket.role === "doctor") {
                    profile = await DoctorProfile.findOne({ user: socket.userId }).select("currentRoomId");
                } else {
                    profile = await PatientProfile.findOne({ user: socket.userId }).select("currentRoomId");
                }
                // check condition
                if (profile && profile.currentRoomId === roomId) {
                    socket.join(roomId);
                    // console.log(`Socket ${socket.id} successfully joined authorized room ${roomId}`);
                } else {
                    // This is a security/consistency check. The user is trying to join a room
                    // that the server does not believe they belong to.
                    console.warn(`Socket ${socket.id} DENIED join for room ${roomId}.`);
                }
            } catch (error) {
                console.error(`Error in joinRoom for socket ${socket.id}:`, error.message);
            }
            // const user = await User.findOne({_id: socket.userId})

            // // Optional: validate that this socket/user is allowed to join the room if you have server-side mapping
            // socket.join(user.currentRoomId);
            // console.log(`Socket ${socket.id} joined room ${roomId} via joinRoom`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            broadcastOnlineUsers();
        });

        // socket.on('disconnect', () => {
        //     console.log('User disconnected', socket.id);
        //     delete userSocketMap[userId];
        //     io.emit('getOnlineUsers', Object.keys(userSocketMap));
        // })
        broadcastOnlineUsers();
    });

    // helper function
    async function broadcastOnlineUsers() {
        const sockets = await io.fetchSockets();
        const userIds = sockets.map((s) => s.userId); // use socket.userId
        io.emit("getOnlineUsers", { userIds });
    }
}

export const ioInstance = () => {
    return io;
};

// export function getReceiverSocketId(receiverId) {
//     return userSocketMap[receiverId];
// }