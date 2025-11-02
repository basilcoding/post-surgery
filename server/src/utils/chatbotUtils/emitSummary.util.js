import Relationship from "../../models/relationship.model.js";
import BotSummary from "../../models/botsummary.model.js";
import PatientProfile from "../../models/patientProfile.model.js";
import DoctorProfile from "../../models/doctorProfile.model.js";
import User from "../../models/user.model.js";  // <-- import User

import { ioInstance } from "../../lib/socket.js";


export const emitSummary = async function (userId, chats, summaryObj, relationship) {
    try {
        console.log('[emitSummary] called', { userId, isEmergency: !!chats?.isEmergency });

        const io = ioInstance();
        console.log('[emitSummary] ioInstance obtained');

        const sockets = await io.fetchSockets();
        console.log('[emitSummary] fetched sockets count:', sockets.length);

        // const onlineUsers = sockets.map((s) => s.userId);
        const onlineUsers = new Set(); // set is better as it only takes nearly O(1) time.
        //  Loop over the sockets and add to the set directly
        for (const socket of sockets) {
            // defensive: some sockets may not have userId
            if (socket.userId) {
                onlineUsers.add(socket.userId.toString());
            }
        }

        console.log('[emitSummary] onlineUsers size:', onlineUsers.size);

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // check if there was a summary sixty minutes ago for the current activeDoctor
        const oldSummary = await BotSummary.findOne({ patient: userId, assignedDoctor: relationship.doctor._id, createdAt: { $gte: oneDayAgo }, type: 'emergency' })

        console.log('[emitSummary] oldSummary found?', !!oldSummary);

        const specialtyNeeded = relationship.careType || "general";
        console.log('[emitSummary] specialtyNeeded:', specialtyNeeded);

        if (oldSummary) {

            let targetDoctor = null;

            if (relationship?.doctor) {
                // normalize doctor id string (oldSummary may have doctor id or populated doctor depending on query)
                const deliveredToList =
                    (oldSummary.deliveredTo || [])
                        .map(d => d);

                console.log('[emitSummary] existing deliveredTo length:', deliveredToList.length);

                oldSummary.content = summaryObj.notes;
                oldSummary.questionsAsked = summaryObj.followUpQuestions;

                let deliveredToAtLeastOne = false;
                for (const deliveredToDoc of deliveredToList) {
                    const docId = deliveredToDoc.doctor?.toString?.();
                    console.log('[emitSummary] checking deliveredTo doctor:', docId);

                    if (docId && onlineUsers.has(docId)) {
                        console.log('[emitSummary] doctor online:', docId);
                        deliveredToDoc.viewed = false;
                        deliveredToDoc.delivered = true;
                        deliveredToDoc.deliveredAt = new Date();

                        deliveredToAtLeastOne = true; // mark that at least one doctor got the message while they were online
                    } else {
                        console.log('[emitSummary] doctor not online or missing id:', docId);
                    }
                }

                await oldSummary.save()
                console.log('[emitSummary] oldSummary saved after update');

                await oldSummary.populate(["patient", "deliveredTo.doctor"]);
                console.log('[emitSummary] oldSummary populated patient and deliveredTo.doctor');

                for (const deliveredToDoc of deliveredToList) {
                    const docId = deliveredToDoc.doctor?._id?.toString ? deliveredToDoc.doctor._id.toString() : deliveredToDoc.doctor?.toString?.();
                    if (docId && onlineUsers.has(docId)) {
                        console.log('[emitSummary] emitting emergencySummaryUpdated to doctor socket:', docId);
                        io.to(docId).emit("emergencySummaryUpdated", { summary: oldSummary });
                    }
                }

                if (!deliveredToAtLeastOne) {

                    console.log('[emitSummary] no deliveredTo doctor was online; searching for any online doctor with specialty', specialtyNeeded);

                    const doctorProfile = await DoctorProfile.findOne({
                        specialty: specialtyNeeded,
                        user: { $in: [...onlineUsers] }, // change the set to an array and then check if one of the online doctors is available
                    }).populate("user");

                    console.log('[emitSummary] doctorProfile found?', !!doctorProfile);

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
                        console.log('[emitSummary] oldSummary saved with newDeliveryStatus');

                        await oldSummary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

                        console.log('[emitSummary] emitting emergencySummaryCreated to routed doctor:', targetDoctor._id.toString());
                        io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary: oldSummary });

                        console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                    } else {
                        console.log('[emitSummary] No online doctors are there for specialty:', specialtyNeeded);
                        // notify the patient directly
                        io.to(userId.toString()).emit("noDoctorAvailable", {
                            message: "No online doctors available! Please call 108 or go to the nearest hospital."
                        });
                    }
                }
            } else {
                console.log('[emitSummary] relationship.doctor missing while oldSummary exists');
            }
        } else {
            // const patientUser = await User.findById(userId);
            let summary = null;

            if (chats.isEmergency) {
                console.log('[emitSummary] creating new emergency summary');
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

                console.log('[emitSummary] emergency summary instance created (not saved yet)');

                if (relationship?.doctor) {
                    const assignedDoctorId = relationship.doctor._id.toString();

                    console.log('[emitSummary] assignedDoctorId:', assignedDoctorId);

                    // console.log('This is how patientUser object looks like', patientUser);
                    if (onlineUsers.has(assignedDoctorId)) {
                        // If the Assigned doctor is online then
                        console.log('[emitSummary] Assigned doctor is online, emitting to them directly');

                        targetDoctor = relationship.doctor;

                        await summary.save();
                        console.log('[emitSummary] emergency summary saved');

                        await summary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit
                        console.log('[emitSummary] emergency summary populated');

                        io.to(assignedDoctorId).emit("emergencySummaryCreated", { summary });
                        console.log('[emitSummary] emitted emergencySummaryCreated to assigned doctor:', assignedDoctorId);
                    } else {

                        console.log('[emitSummary] assigned doctor is not online; searching for another online doctor with specialty', specialtyNeeded);

                        const doctorProfile = await DoctorProfile.findOne({
                            specialty: specialtyNeeded,
                            user: { $in: [...onlineUsers] }, // change set to an array and then check if one of the online doctors is available
                        }).populate("user");

                        console.log('[emitSummary] alternate doctorProfile found?', !!doctorProfile);

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
                            console.log('[emitSummary] emergency summary saved with alternate doctor delivery');

                            await summary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

                            io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary });
                            console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                        } else {
                            console.log('[emitSummary] No online doctors are there. notifying patient');
                            // notify the patient directly
                            io.to(userId.toString()).emit("noDoctorAvailable", {
                                message: "No online doctors available! Please call 108 or go to the nearest hospital."
                            });
                        }
                    }
                } else {
                    console.log('[emitSummary] relationship.doctor missing when creating emergency summary');
                }
            } else {
                // Journal flow
                console.log('[emitSummary] creating journal summary');
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
                console.log('[emitSummary] journal summary saved');

                await summary.populate(["patient", "deliveredTo.doctor"]);
                console.log('[emitSummary] journal summary populated');

                if (onlineUsers.has(doctorId)) {
                    console.log('[emitSummary] doctor for journal is online; emitting journalSummaryCreated to', doctorId);
                    io.to(doctorId).emit("journalSummaryCreated", { summary });
                } else {
                    console.log('[emitSummary] doctor for journal is not online:', doctorId);
                }

            }
        }

    } catch (error) {
        console.log("Error in emitSummary: ", error);
    }
};
// Note: This function emits summary events to the appropriate doctor sockets.


// import Relationship from "../../models/relationship.model.js";
// import BotSummary from "../../models/botsummary.model.js";
// import PatientProfile from "../../models/patientProfile.model.js";
// import DoctorProfile from "../../models/doctorProfile.model.js";
// import User from "../../models/user.model.js";  // <-- import User

// import { ioInstance } from "../../lib/socket.js";


// export const emitSummary = async function (userId, chats, summaryObj, relationship) {
//     try {
//         const io = ioInstance();
//         const sockets = await io.fetchSockets();
//         // const onlineUsers = sockets.map((s) => s.userId);
//         const onlineUsers = new Set(); // set is better as it only takes nearly O(1) time.
//         //  Loop over the sockets and add to the set directly
//         for (const socket of sockets) {
//             onlineUsers.add(socket.userId.toString());
//         }

//         const now = new Date();
//         const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//         // check if there was a summary sixty minutes ago for the current activeDoctor
//         const oldSummary = await BotSummary.findOne({ patient: userId, assignedDoctor: relationship.doctor._id, createdAt: { $gte: oneDayAgo }, type: 'emergency' })

//         const specialtyNeeded = relationship.careType || "general";

//         if (oldSummary) {

//             let targetDoctor = null;

//             if (relationship?.doctor) {
//                 // normalize doctor id string (oldSummary may have doctor id or populated doctor depending on query)
//                 const deliveredToList =
//                     (oldSummary.deliveredTo || [])
//                         .map(d => d);

//                 oldSummary.content = summaryObj.notes;
//                 oldSummary.questionsAsked = summaryObj.followUpQuestions;

//                 let deliveredToAtLeastOne = false;
//                 for (const deliveredToDoc of deliveredToList) {
//                     if (onlineUsers.has(deliveredToDoc.doctor.toString())) {
//                         deliveredToDoc.viewed = false;
//                         deliveredToDoc.delivered = true;
//                         deliveredToDoc.deliveredAt = new Date();

//                         deliveredToAtLeastOne = true; // mark that at least one doctor got the message while they were online
//                     }
//                 }

//                 await oldSummary.save()
//                 await oldSummary.populate(["patient", "deliveredTo.doctor"]);

//                 for (const deliveredToDoc of deliveredToList) {
//                     if (onlineUsers.has(deliveredToDoc.doctor.toString())) {
//                         io.to(deliveredToDoc.doctor.toString()).emit("emergencySummaryUpdated", { summary: oldSummary });
//                     }
//                 }

//                 if (!deliveredToAtLeastOne) {

//                     const doctorProfile = await DoctorProfile.findOne({
//                         specialty: specialtyNeeded,
//                         user: { $in: [...onlineUsers] }, // change the set to an array and then check if one of the online doctors is available
//                     }).populate("user");

//                     if (doctorProfile) {
//                         targetDoctor = doctorProfile.user;

//                         // Create the new delivery status object
//                         const newDeliveryStatus = {
//                             doctor: targetDoctor._id, // Use the ID of the doctor you found
//                             delivered: true,
//                             deliveredAt: new Date(),
//                             viewed: false,
//                         };

//                         oldSummary.deliveredTo.push(newDeliveryStatus);

//                         await oldSummary.save();
//                         await oldSummary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

//                         io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary: oldSummary });

//                         console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
//                     } else {
//                         console.log("No online doctors are there.");
//                         // notify the patient directly
//                         io.to(userId.toString()).emit("noDoctorAvailable", {
//                             message: "No online doctors available! Please call 108 or go to the nearest hospital."
//                         });
//                     }
//                 }
//             }
//         } else {
//             // const patientUser = await User.findById(userId);
//             let summary = null;

//             if (chats.isEmergency) {
//                 // const relationship = await Relationship.findOne({ patient: userId }).populate("doctor");
//                 let targetDoctor = null;
//                 summary = await BotSummary({
//                     patient: userId,
//                     type: "emergency",
//                     content: summaryObj.notes,
//                     questionsAsked: summaryObj.followUpQuestions,
//                     assignedDoctor: relationship.doctor._id,
//                     deliveredTo: [
//                         {
//                             doctor: relationship.doctor._id,
//                             delivered: true,
//                             deliveredAt: new Date(),
//                             viewed: false,
//                         }
//                     ],
//                 });

//                 if (relationship?.doctor) {
//                     const assignedDoctorId = relationship.doctor._id.toString();

//                     // console.log('This is how patientUser object looks like', patientUser);
//                     if (onlineUsers.has(assignedDoctorId)) {
//                         // If the Assigned doctor is online then
//                         console.log('emiting to the online related doctor!', onlineUsers);

//                         targetDoctor = relationship.doctor;

//                         // const newDeliveryStatus = {
//                         //     doctor: targetDoctor._id, // Use the ID of the doctor you found
//                         //     delivered: true,
//                         //     deliveredAt: new Date(),
//                         //     viewed: false,
//                         // };

//                         // summary.deliveredTo.push(newDeliveryStatus);

//                         await summary.save();
//                         await summary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

//                         io.to(assignedDoctorId).emit("emergencySummaryCreated", { summary });
//                     } else {

//                         const doctorProfile = await DoctorProfile.findOne({
//                             specialty: specialtyNeeded,
//                             user: { $in: [...onlineUsers] }, // change set to an array and then check if one of the online doctors is available
//                         }).populate("user");

//                         if (doctorProfile) {
//                             targetDoctor = doctorProfile.user;

//                             const newDeliveryStatus = {
//                                 doctor: targetDoctor._id, // Use the ID of the doctor you found
//                                 delivered: true,
//                                 deliveredAt: new Date(),
//                                 viewed: false,
//                             };

//                             summary.deliveredTo.push(newDeliveryStatus);

//                             await summary.save();
//                             await summary.populate(["patient", "deliveredTo.doctor"]); // populate both before emit

//                             io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary });
//                             console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
//                         } else {
//                             console.log("No online doctors are there.");
//                             // notify the patient directly
//                             io.to(userId.toString()).emit("noDoctorAvailable", {
//                                 message: "No online doctors available! Please call 108 or go to the nearest hospital."
//                             });
//                         }
//                     }
//                 }
//             } else {
//                 // Journal flow
//                 // const relationships = await Relationship.find({ patient: userId }).populate("doctor");

//                 const doctorId = relationship.doctor._id.toString();

//                 summary = await BotSummary({
//                     patient: userId,
//                     type: "journal",
//                     content: summaryObj.notes,
//                     questionsAsked: summaryObj.followUpQuestions,
//                     assignedDoctor: relationship.doctor._id,
//                     deliveredTo: [
//                         {
//                             doctor: relationship.doctor._id,
//                             delivered: true,
//                             deliveredAt: new Date(),
//                             viewed: false,
//                         }
//                     ],
//                 });

//                 await summary.save();
//                 await summary.populate(["patient", "deliveredTo.doctor"]);

//                 if (onlineUsers.has(doctorId)) {
//                     // const newDeliveryStatus = {
//                     //     doctor: doctorId, // Use the ID of the doctor you found
//                     //     delivered: true,
//                     //     deliveredAt: new Date(),
//                     //     viewed: false,
//                     // };

//                     // summary.deliveredTo.push(newDeliveryStatus);

//                     // populate both before emit

//                     io.to(doctorId).emit("journalSummaryCreated", { summary });
//                 }

//             }
//         }

//     } catch (error) {
//         console.log("Error in emitSummary: ", error);
//     }
// };
// // Note: This function emits summary events to the appropriate doctor sockets.