import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Middleware to protect routes
// next is used to call the next middle/controller after this middleware function is done
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt; // .jwt is used to extract the token becuase the token was first sent in the name of 'jwt' to the user
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - No Token Provided!' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized - No Token Provided!' });
        }
        // decoded.userId is the ID of the user from the token
        const user = await User.findById(decoded.userId).select('-password'); // exclude the password field

        if (!user) {
            return res.status(404).json({ message: 'User Not Found!' })
        }

        req.user = user;

        next();

    } catch (error) {
        console.log('Error in protectRoute middleware (auth.middle.js):', error.message);
        return res.status(401).json({ message: "Unauthorized - Invalid or Expired Token" });
    }
}

//IMPORTANT PLEASE READ <-- USE OF PROTECTROOM
// No, you should definitely not remove the decoded.roomId !== roomId check. It's a crucial part of your security that serves a different, and equally important, purpose than the user ID check.

// Think of your authorization as answering two separate questions:

// Who are you?

// What are you allowed to access?

// Your current middleware correctly answers both, and removing one would create a serious vulnerability.

// ## The 'Who' vs. The 'What': Why Both Checks Are Essential
// Your two checks are not redundant; they protect against different types of attacks.

// decoded.userId !== id.toString() (The WHO Check)
// This check answers the question: "Are you the person this room token was issued to?" It ensures that the user authenticated with the main jwt token is the same person specified inside the roomToken. This prevents a malicious user from stealing another user's roomToken and using it with their own login session.

// decoded.roomId !== roomId (The WHAT Check)
// This check answers the question: "Is this room token valid for the specific room you are trying to access right now?" It ensures that a token issued for room-A cannot be used to access room-B. This is your primary defense against a user accessing conversations they are not part of.

// ## A Real-World Attack Scenario Without the Room ID Check
// Imagine you remove the roomId check. Here's how a user could access a conversation they shouldn't:

// Setup:

// Doctor Alice is having a valid, authorized session with Patient Bob in room-123. Alice has a valid roomToken cookie for this room.

// Simultaneously, Doctor Charlie is having a session with Patient Dave in room-456.

// The Attack:

// Doctor Alice (the attacker) is clever. She knows the API endpoint structure and guesses or discovers the ID of the other active room, room-456.

// She makes a manual API request from her browser's console or a tool like Postman to fetch messages from the other room: GET /api/messages/room/room-456.

// Her browser automatically sends her main jwt cookie (which is valid) and her roomToken cookie (which is for room-123).

// The Outcome (If you remove the check):

// Your protectRoom middleware runs.

// It checks the user ID: decoded.userId (from Alice's roomToken) matches req.user._id (from Alice's jwt). The WHO check passes! ✅

// Since the WHAT check is gone, the middleware allows the request to proceed.

// Result: Doctor Alice successfully fetches the private conversation from room-456 between Doctor Charlie and Patient Dave. This is a major data breach.
export const protectRoom = async (req, res, next) => {
    try {
        // console.log('Protecting room for user:', req.user._id);
        let { roomId } = req.params;
        const id = req.user._id;

        const token = req.cookies.roomToken; // ✅ read from cookies

        if (!token) {
            return res.status(401).json({ message: "Unauthorized, you do not have a valid token!" });
        }

        // fetch authoritative user record (ensure req.user is in sync)
        // const user = await User.findById(id).select("currentRoomId role");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("decoded.roomId is: ", decoded.roomId, " and roomId is: ", roomId)
        // console.log("decoded.userId is: ", decoded.userId, " and Id is: ", id.toString())
        if (decoded.roomId !== roomId || decoded.userId !== id.toString()) {
            return res.status(401).json({ message: "Unauthorized, token you provided is not valid!" });
        }
        // if (!user || user.currentRoomId !== decoded.roomId || decoded.roomId !== roomId) {
        //     return res.status(401).json({ message: "Room is either Unavailable or has Expired!" });
        // }


        // attach roomId to req for controllers
        req.roomId = decoded.roomId;
        req.userId = decoded.userId;
        req.selectedUser = decoded.selectedUser;
        next();
    } catch (err) {
        console.error("Error in protectRoom middleware:", err.message);
        res.status(401).json({ message: "Room is either Unavailable or has Expired!" });
    }
}

export const requireRole = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Access denied" });
        }
        next();
    };
};

export const requireSelfAndRole = (roles = []) => {
    return (req, res, next) => {
        try {
            const { userId } = req.params;

            const isSelf = req.user._id.toString() === userId;
            const hasRole = roles.includes(req.user.role);
            console.log(req.params.userId)
            if (isSelf && hasRole) {

                return next();
            }

            // they are allowed to continue if isSelf is there
            // And
            // they are allowed to continue if hasRole is there
            return res.status(403).json({ message: "Forbidden: Not your resource" });
        } catch (error) {
            console.error("Error in requireSelfAndRole middleware:", error.message);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
