import Relationship from "../../models/relationship.model.js";
import BotSummary from "../../models/botsummary.model.js";
import PatientProfile from "../../models/patientProfile.model.js";
import DoctorProfile from "../../models/doctorProfile.model.js";
import User from "../../models/user.model.js";  // <-- import User

import { ioInstance } from "../../lib/socket.js";


export const emitSummary = async function (userId, chats, summaryObj, relationship) {
    try {
        const io = ioInstance();
        const sockets = await io.fetchSockets();
        // const onlineUsers = sockets.map((s) => s.userId);
        const onlineUsers = new Set(); // set is better as it only takes nearly O(1) time.
        //  Loop over the sockets and add to the set directly
        for (const socket of sockets) {
            onlineUsers.add(socket.userId.toString());
        }

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // check if there was a summary sixty minutes ago for the current activeDoctor
        const oldSummary = await BotSummary.findOne({ patient: userId, assignedDoctor: relationship.doctor._id, createdAt: { $gte: oneDayAgo }, type: 'emergency' })

        const specialtyNeeded = relationship.careType || "general";

        if (oldSummary) {

            let targetDoctor = null;

            if (relationship?.doctor) {
                // normalize doctor id string (oldSummary may have doctor id or populated doctor depending on query)
                const deliveredToList =
                    (oldSummary.deliveredTo || [])
                        .map(d => d);

                oldSummary.content = summaryObj.notes;
                oldSummary.questionsAsked = summaryObj.followUpQuestions;

                let deliveredToAtLeastOne = false;
                for (const deliveredToDoc of deliveredToList) {
                    if (onlineUsers.has(deliveredToDoc.doctor.toString())) {
                        deliveredToDoc.viewed = false;
                        deliveredToDoc.delivered = true;
                        deliveredToDoc.deliveredAt = new Date();

                        deliveredToAtLeastOne = true; // mark that at least one doctor got the message while they were online
                    }
                }

                await oldSummary.save()
                await oldSummary.populate(["patient", "deliveredTo.doctor"]);

                for (const deliveredToDoc of deliveredToList) {
                    if (onlineUsers.has(deliveredToDoc.doctor.toString())) {
                        io.to(deliveredToDoc.doctor.toString()).emit("emergencySummaryUpdated", { summary: oldSummary });
                    }
                }

                if (!deliveredToAtLeastOne) {

                    const doctorProfile = await DoctorProfile.findOne({
                        specialty: specialtyNeeded,
                        user: { $in: [...onlineUsers] }, // change the set to an array and then check if one of the online doctors is available
                    }).populate("user");

                    if (doctorProfile) {
                        targetDoctor = doctorProfile.user;

                        // Create the new delivery status object
                        const newDeliveryStatus = {
                            doctor: targetDoctor._id, // Use the ID of the doctor you found
                            delivered: true,
                            deliveredAt: new Date(),
                            viewed: false,
                        };

                        oldSummary.deliveredTo.push(newDeliveryStatus);

                        await oldSummary.save();
                        await oldSummary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

                        io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary: oldSummary });

                        console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                    } else {
                        console.log("No online doctors are there.");
                        // notify the patient directly
                        io.to(userId.toString()).emit("noDoctorAvailable", {
                            message: "No online doctors available! Please call 108 or go to the nearest hospital."
                        });
                    }
                }
            }
        } else {
            // const patientUser = await User.findById(userId);
            let summary = null;

            if (chats.isEmergency) {
                // const relationship = await Relationship.findOne({ patient: userId }).populate("doctor");
                let targetDoctor = null;
                summary = await BotSummary({
                    patient: userId,
                    type: "emergency",
                    content: summaryObj.notes,
                    questionsAsked: summaryObj.followUpQuestions,
                    assignedDoctor: relationship.doctor._id,
                    deliveredTo: [
                        {
                            doctor: relationship.doctor._id,
                            delivered: true,
                            deliveredAt: new Date(),
                            viewed: false,
                        }
                    ],
                });

                if (relationship?.doctor) {
                    const assignedDoctorId = relationship.doctor._id.toString();

                    // console.log('This is how patientUser object looks like', patientUser);
                    if (onlineUsers.has(assignedDoctorId)) {
                        // If the Assigned doctor is online then
                        console.log('emiting to the online related doctor!', onlineUsers);

                        targetDoctor = relationship.doctor;

                        // const newDeliveryStatus = {
                        //     doctor: targetDoctor._id, // Use the ID of the doctor you found
                        //     delivered: true,
                        //     deliveredAt: new Date(),
                        //     viewed: false,
                        // };

                        // summary.deliveredTo.push(newDeliveryStatus);

                        await summary.save();
                        await summary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

                        io.to(assignedDoctorId).emit("emergencySummaryCreated", { summary });
                    } else {

                        const doctorProfile = await DoctorProfile.findOne({
                            specialty: specialtyNeeded,
                            user: { $in: [...onlineUsers] }, // change set to an array and then check if one of the online doctors is available
                        }).populate("user");

                        if (doctorProfile) {
                            targetDoctor = doctorProfile.user;

                            const newDeliveryStatus = {
                                doctor: targetDoctor._id, // Use the ID of the doctor you found
                                delivered: true,
                                deliveredAt: new Date(),
                                viewed: false,
                            };

                            summary.deliveredTo.push(newDeliveryStatus);

                            await summary.save();
                            await summary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

                            io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary });
                            console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                        } else {
                            console.log("No online doctors are there.");
                            // notify the patient directly
                            io.to(userId.toString()).emit("noDoctorAvailable", {
                                message: "No online doctors available! Please call 108 or go to the nearest hospital."
                            });
                        }
                    }
                }
            } else {
                // Journal flow
                // const relationships = await Relationship.find({ patient: userId }).populate("doctor");

                const doctorId = relationship.doctor._id.toString();

                summary = await BotSummary({
                    patient: userId,
                    type: "journal",
                    content: summaryObj.notes,
                    questionsAsked: summaryObj.followUpQuestions,
                    assignedDoctor: relationship.doctor._id,
                    deliveredTo: [
                        {
                            doctor: relationship.doctor._id,
                            delivered: true,
                            deliveredAt: new Date(),
                            viewed: false,
                        }
                    ],
                });

                await summary.save();
                await summary.populate(["patient", "deliveredTo.doctor"]);

                if (onlineUsers.has(doctorId)) {
                    // const newDeliveryStatus = {
                    //     doctor: doctorId, // Use the ID of the doctor you found
                    //     delivered: true,
                    //     deliveredAt: new Date(),
                    //     viewed: false,
                    // };

                    // summary.deliveredTo.push(newDeliveryStatus);

                    // populate both before emit

                    io.to(doctorId).emit("journalSummaryCreated", { summary });
                }

            }
        }

    } catch (error) {
        console.log("Error in emitSummary: ", error);
    }
};
// Note: This function emits summary events to the appropriate doctor sockets.