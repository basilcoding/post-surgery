import Relationship from "../models/relationship.model.js";
import BotSummary from "../models/botsummary.model.js";
import PatientProfile from "../models/patientProfile.model.js";
import DoctorProfile from "../models/doctorProfile.model.js";
import User from "../models/user.model.js";  // <-- import User
import { ioInstance } from "../lib/socket.js";

export const emitSummary = async function (userId, chats, summaryObj, res) {
    try {
        const io = ioInstance();

        // Fetch patient user (for email)
        const patientUser = await User.findById(userId);

        if (chats.isEmergency) {
            const relationship = await Relationship.findOne({ patient: userId }).populate("doctor");

            let targetDoctor = null;

            if (relationship?.doctor) {
                const assignedDoctorId = relationship.doctor._id.toString();

                const sockets = await io.fetchSockets();
                const onlineUsers = sockets.map((s) => s.userId);

                console.log('emiting to the online related doctor!', onlineUsers);
                console.log('This is how patientUser object looks like', patientUser);
                if (onlineUsers.includes(assignedDoctorId)) {
                    // If the Assigned doctor is online then
                    targetDoctor = relationship.doctor;
                    io.to(assignedDoctorId).emit("emergencySummaryCreated", {
                        _id: assignedDoctorId,
                        patient: patientUser,   // <-- include patient email
                        email: relationship.doctor.email,    // <-- include doctor email
                        type: "emergency",
                        content: summaryObj.notes,
                        questionsAsked: summaryObj.followUpQuestions,
                    });
                    // io.to(assignedDoctorId).emit("emergencySummaryCreated", {
                    //     patientId: userId,
                    //     patientEmail: patientUser?.email || null,   // <-- include patient email
                    //     doctorId: assignedDoctorId,
                    //     doctorEmail: relationship.doctor.email,    // <-- include doctor email
                    //     type: "emergency",
                    //     content: summaryObj.notes,
                    //     questionsAsked: summaryObj.followUpQuestions,
                    // });
                } else {
                    // If the Assigned doctor offline then fallback
                    const patientProfile = await PatientProfile.findOne({ user: userId });
                    const specialtyNeeded = patientProfile?.primaryRequiredSpecialty || "general";

                    const doctorProfile = await DoctorProfile.findOne({
                        specialty: specialtyNeeded,
                        user: { $in: onlineUsers },
                    }).populate("user");

                    if (doctorProfile) {
                        targetDoctor = doctorProfile.user;
                        io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", {
                            _id: targetDoctor._id,
                            patient: patientUser,   // <-- include patient email
                            email: targetDoctor.email,    // <-- include doctor email
                            type: "emergency",
                            content: summaryObj.notes,
                            questionsAsked: summaryObj.followUpQuestions,
                        });
                        // io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", {
                        //     patientId: userId,
                        //     patientEmail: patientUser?.email || null,
                        //     doctorId: targetDoctor._id,
                        //     doctorEmail: targetDoctor.email,
                        //     type: "emergency",
                        //     content: summaryObj.notes,
                        //     questionsAsked: summaryObj.followUpQuestions,
                        // });
                        console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                    } else {
                        console.log("No online doctors are there.");
                        // notify the patient directly
                        io.to(userId.toString()).emit("noDoctorAvailable", {
                            message: "No online doctors available! Please call 108 or go to the nearest hospital."
                        });
                    }
                }

                // Persist for assigned doctor regardless
                await BotSummary.create({
                    patient: userId,
                    doctor: relationship.doctor._id,
                    type: "emergency",
                    content: summaryObj.notes,
                    questionsAsked: summaryObj.followUpQuestions,
                    delivered: !!targetDoctor,
                });

                // Persist for fallback doctor too
                if (targetDoctor && targetDoctor._id.toString() !== relationship.doctor._id.toString()) {
                    await BotSummary.create({
                        patient: userId,
                        doctor: targetDoctor._id,
                        type: "emergency",
                        content: summaryObj.notes,
                        questionsAsked: summaryObj.followUpQuestions,
                        delivered: true,
                    });
                }
            }
        } else {
            // Journal flow
            const relationships = await Relationship.find({ patient: userId }).populate("doctor");

            const sockets = await io.fetchSockets();
            const onlineUsers = sockets.map((s) => s.userId);

            for (const rel of relationships) {
                const doctorId = rel.doctor._id.toString();

                await BotSummary.create({
                    patient: userId,
                    doctor: doctorId,
                    type: "journal",
                    content: summaryObj.notes,
                    questionsAsked: summaryObj.followUpQuestions,
                });
                if (onlineUsers.includes(doctorId)) {
                    io.to(doctorId).emit("journalSummaryCreated", {
                        _id: doctorId,
                        patient: patientUser,   // <-- include patient email
                        email: rel.doctor.email,    // <-- include doctor email
                        type: "emergency",
                        content: summaryObj.notes,
                        questionsAsked: summaryObj.followUpQuestions,
                    });
                }
                // if (onlineUsers.includes(doctorId)) {
                //     io.to(doctorId).emit("journalSummaryCreated", {
                //         patientId: userId,
                //         patientEmail: patientUser?.email || null,   // <-- add patient email
                //         doctorId,
                //         doctorEmail: rel.doctor.email,             // <-- add doctor email
                //         type: "journal",
                //         content: summaryObj.notes,
                //         questionsAsked: summaryObj.followUpQuestions,
                //     });
                // }
            }
        }
    } catch (error) {
        console.log("Error in emitSummary: ", error);
    }
};
// Note: This function emits summary events to the appropriate doctor sockets.