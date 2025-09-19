import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// dotenv.config();

export const generateToken = (userId, role, res) => {
    const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    })

    // creating a cookie and send it to the user
    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks (http cookie)
        sameSite: 'strict', // CSRF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV === 'production'
    })

    return token; // useless return statement
}
