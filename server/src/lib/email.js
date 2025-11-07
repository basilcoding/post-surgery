// lib/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config()

// transporter is aldready configured in this file so whenever you import the sendMail function anywhere, mailOptions will use transporter object from this file
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const sendMail = async (receiver, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiver,
        subject,
        text,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
    } catch (error) {
        console.error('Error occurred while sending mail:', error);
    }
};
