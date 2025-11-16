import Relationship from "../../models/relationship.model.js";
import BotSummary from "../../models/botsummary.model.js";
import PatientProfile from "../../models/patientProfile.model.js";
import DoctorProfile from "../../models/doctorProfile.model.js";
import User from "../../models/user.model.js";  // <-- import User

import { ioInstance } from "../../lib/socket.js";


export const emitSummary = async function (userId, summaryObj, oldSummary = null, relationship, patientProfile, formattedTimestamp) {
    try {
        console.log('[emitSummary] called', { userId, summaryType: summaryObj.summaryType });

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

        // const now = new Date();
        // // const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // // start of today (server-local) at 00:00:00
        // const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // // check if there was a summary after start of current day(12:00 am midnight) ago for the current activeDoctor
        // let oldSummary = await BotSummary.findOne({ user: userId, assignedDoctor: relationship.doctor._id, createdAt: { $gte: startOfToday } })
        // console.log('[emitSummary] oldSummary found?', !!oldSummary);

        const specialtyNeeded = relationship.careType || "general";
        console.log('[emitSummary] specialtyNeeded:', specialtyNeeded);

        if (oldSummary) {

            let targetDoctor = null;

            // if (relationship?.doctor) {
            // normalize doctor id string (oldSummary may have doctor id or populated doctor depending on query)

            // oldSummary.content.push(...summaryObj.content);
            // oldSummary.questionsAsked.push(...summaryObj.followUpQuestions);
            // oldSummary.status = 'New';
            // oldSummary.type = summaryObj.summaryType;
            // oldSummary.formattedTimestamps.push(formattedTimestamp);

            oldSummary.content.unshift(...summaryObj.content);
            oldSummary.questionsAsked.unshift(...summaryObj.followUpQuestions);
            oldSummary.status = 'New';
            oldSummary.type = summaryObj.summaryType;
            oldSummary.formattedTimestamps.unshift(formattedTimestamp);

            let deliveredToAtLeastOne = false;
            for (const deliveredToDoc of oldSummary.deliveredTo) {
                const docId = deliveredToDoc.doctor?.toString?.();
                console.log('[emitSummary] checking deliveredTo doctor:', docId);

                if (docId && onlineUsers.has(docId)) {
                    console.log('[emitSummary] doctor online:', docId);
                    deliveredToDoc.delivered = true;
                    deliveredToDoc.deliveredAt = new Date();
                    deliveredToAtLeastOne = true; // mark that at least one doctor got the message while they were online
                } else {
                    console.log('[emitSummary] doctor not online or missing id:', docId);
                }
            }

            await oldSummary.save()
            console.log('[emitSummary] oldSummary saved after update');

            oldSummary = await oldSummary.populate([
                "user",
                "patient",
                { path: "assignedDoctor", select: "fullName" },
                { path: "deliveredTo.doctor", select: "fullName" },
                { path: "deliveredTo.doctorProfile", select: "doctorId" }]);
            oldSummary = oldSummary.toObject();

            const deliveredToList =
                (oldSummary.deliveredTo || [])
                    .map(d => d);
            console.log('[emitSummary] existing deliveredTo length:', deliveredToList.length);

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
                        doctorProfile: doctorProfile._id,
                        delivered: true,
                        deliveredAt: new Date(),
                    };

                    oldSummary.deliveredTo.push(newDeliveryStatus);

                    await oldSummary.save();
                    console.log('[emitSummary] oldSummary saved with newDeliveryStatus');

                    oldSummary = await oldSummary.populate([
                        "user",
                        "patient",
                        { path: "assignedDoctor", select: "fullName" },
                        { path: "deliveredTo.doctor", select: "fullName" },// populate both before emit
                        { path: "deliveredTo.doctorProfile", select: "doctorId" }]);

                    oldSummary = oldSummary.toObject();

                    console.log('[emitSummary] emitting emergencySummaryCreated to routed doctor:', targetDoctor._id.toString());
                    io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary: oldSummary });

                    console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                } else {
                    console.log('[emitSummary] No online doctors are there for specialty:', specialtyNeeded);
                    // notify the patient directly

                    // await oldSummary.save();

                    console.log('[emitSummary] oldSummary saved with newDeliveryStatus');
                    io.to(userId.toString()).emit("noDoctorAvailable", {
                        message: "No online doctors available! Please call 108 or go to the nearest hospital."
                    });
                }
            }
            // } 
            // else if (!relationship?.doctor) {
            // console.log('[emitSummary] relationship.doctor missing while oldSummary exists');
            // }
        } else {
            // const patientUser = await User.findById(userId);
            let summary = null;

            // IF AN OLD SUMMARY DOES NOT EXIST, CREATE A NEW ONE.
            // CHECK THE SUMMARYTYPE WHICH THE BOT HAS DETERMINED FOR THE SUMMARY AND CREATE THE SUMMARY ACCORDINGLY!
            if (summaryObj.summaryType === 'emergency') {
                console.log('[emitSummary] creating new emergency summary');
                // const relationship = await Relationship.findOne({ patient: userId }).populate("doctor");
                let targetDoctor = null;
                summary = new BotSummary({
                    user: userId,
                    patient: patientProfile._id,
                    type: "emergency",
                    content: summaryObj.content,
                    questionsAsked: summaryObj.followUpQuestions,
                    assignedDoctor: relationship.doctor._id,
                    assignedDoctorProfile: relationship.doctorProfile._id,
                    status: 'New',
                    formattedTimestamps: formattedTimestamp,
                    deliveredTo: [
                        {
                            doctor: relationship.doctor._id,
                            doctorProfile: relationship.doctorProfile._id,
                            delivered: true,
                            deliveredAt: new Date(),
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

                        summary = await summary.populate([
                            "user",
                            "patient",
                            { path: "assignedDoctor", select: "fullName" },
                            { path: "deliveredTo.doctor", select: "fullName" },
                            { path: "deliveredTo.doctorProfile", select: "doctorId" }]);
                        summary = summary.toObject();

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
                                doctorProfile: doctorProfile._id,
                                delivered: true,
                                deliveredAt: new Date(),
                            };

                            summary.deliveredTo.push(newDeliveryStatus);

                            await summary.save();
                            console.log('[emitSummary] emergency summary saved with alternate doctor delivery');

                            summary = await summary.populate([
                                "user",
                                "patient",
                                { path: "assignedDoctor", select: "fullName" },
                                { path: "deliveredTo.doctor", select: "fullName" },
                                { path: "deliveredTo.doctorProfile", select: "doctorId" }]);

                            summary = summary.toObject();

                            io.to(targetDoctor._id.toString()).emit("emergencySummaryCreated", { summary });
                            console.log(`Emergency routed to available ${specialtyNeeded} doctor: ${targetDoctor.fullName}`);
                        } else {
                            console.log('[emitSummary] No online doctors are there. saving the document to the db and notifying patient');
                            // notify the patient directly
                            summary = new BotSummary({
                                user: userId,
                                patient: patientProfile._id,
                                type: "emergency",
                                content: summaryObj.content,
                                questionsAsked: summaryObj.followUpQuestions,
                                assignedDoctor: relationship.doctor._id,
                                assignedDoctorProfile: relationship.doctorProfile._id,
                                status: 'New',
                                deliveredTo: [
                                    {
                                        doctor: relationship.doctor._id,
                                        doctorProfile: relationship.doctorProfile._id,
                                        delivered: false,
                                        deliveredAt: new Date(),
                                    }
                                ],
                            });
                            await summary.save();
                            io.to(userId.toString()).emit("noDoctorAvailable", {
                                message: "No online doctors available! Please call 108 or go to the nearest hospital."
                            });
                        }
                    }
                } else {
                    console.log('[emitSummary] relationship.doctor missing when creating emergency summary');
                }
            } else if (summaryObj.summaryType === 'journal') {
                // Journal flow
                console.log('[emitSummary] creating journal summary');
                // const relationships = await Relationship.find({ patient: userId }).populate("doctor");

                const doctorId = relationship.doctor._id.toString();

                summary = new BotSummary({
                    user: userId,
                    patient: patientProfile._id,
                    type: "journal",
                    content: summaryObj.content,
                    questionsAsked: summaryObj.followUpQuestions,
                    assignedDoctor: relationship.doctor._id,
                    assignedDoctorProfile: relationship.doctorProfile._id,
                    status: 'New',
                    formattedTimestamps: formattedTimestamp,
                    deliveredTo: [
                        {
                            doctor: relationship.doctor._id,
                            doctorProfile: relationship.doctorProfile._id,
                            delivered: true,
                            deliveredAt: new Date(),
                        }
                    ],
                });

                await summary.save();
                console.log('[emitSummary] journal summary saved');

                summary = await summary.populate([
                    "user",
                    "patient",
                    { path: "assignedDoctor", select: "fullName" },
                    { path: "deliveredTo.doctor", select: "fullName" },
                    { path: "deliveredTo.doctorProfile", select: "doctorId" }]);

                summary = summary.toObject();
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
