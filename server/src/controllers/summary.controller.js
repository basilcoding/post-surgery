import BotSummary from "../models/botsummary.model.js";
import Relationship from "../models/relationship.model.js";
import { ioInstance } from "../lib/socket.js";
import { Blob } from "buffer";
import pinata from "../lib/pinata.js";

export const getSummaries = async (req, res) => {
    try {
        if (req.user.role === 'doctor') {
            // don't get confused, here type is either journal or emergency
            const { type } = req.query;
            const doctorId = req.user._id; // protectRoute runs before
            const now = new Date();
            // know that current time is always larger than the time that was seven days ago
            // const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // only the documents where it has --> the given type, createdAt specific days ago, and the deliveredTo array must contain the given doctorId (viewed: true/false also depending on the query)
            const [newData, underReviewData, resolvedData] = await Promise.all([
                BotSummary.find({
                    status: 'New',
                    deliveredTo: { $elemMatch: { doctor: doctorId } },
                }).populate(["user", "patient",
                    {
                        path: "assignedDoctor",
                        select: "fullName"
                    },
                    {
                        path: "deliveredTo.doctor",
                        select: "fullName"
                    }]).lean(),

                BotSummary.find({
                    status: 'UnderReview',
                    deliveredTo: { $elemMatch: { doctor: doctorId } },
                }).populate(["user", "patient",
                    {
                        path: "assignedDoctor",
                        select: "fullName"
                    },
                    {
                        path: "deliveredTo.doctor",
                        select: "fullName"
                    }
                ]).lean(),

                BotSummary.find({
                    status: 'Resolved',
                    deliveredTo: { $elemMatch: { doctor: doctorId } },
                }).populate(["user", "patient",
                    {
                        path: "assignedDoctor",
                        select: "fullName"
                    },
                    {
                        path: "deliveredTo.doctor",
                        select: "fullName"
                    }
                ]).lean(),
            ]);

            return res.json({
                summaries: {
                    newSummaries: newData,
                    underReviewSummaries: underReviewData,
                    resolvedSummaries: resolvedData,
                }
            });
        } else if (req.user.role === 'patient') {
            // don't get confused, here type is either journal or emergency
            // const { type } = req.query;
            const userId = req.user._id; // protectRoute runs before
            const now = new Date();

            if (!userId) {
                res.status(400).json({ message: 'UserId and Type of summary is required!' })
            }

            // know that current time is always larger than the time that was seven days ago
            // const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // only the documents where it has --> the given type, createdAt specific days ago, and the deliveredTo array must contain the given doctorId (viewed: true/false also depending on the query)
            const [newData, underReviewData, resolvedData] = await Promise.all([
                BotSummary.find({
                    status: 'New',
                    user: userId,
                }).populate(["user", "patient"]).lean(),

                BotSummary.find({
                    status: 'UnderReview',
                    user: userId,
                }).populate(["user", "patient"]).lean(),

                BotSummary.find({
                    status: 'Resolved',
                    user: userId,
                }).populate(["user", "patient"]).lean(),
            ]);

            return res.json({
                summaries: {
                    newSummaries: newData,
                    underReviewSummaries: underReviewData,
                    resolvedSummaries: resolvedData,
                }
            });
        }

    } catch (err) {
        console.error("getSummaries error", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// export const updateSummaryStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         const allowed = ["New", "UnderReview", "Resolved"];
//         if (!allowed.includes(status)) {
//             return res.status(400).json({ message: "Invalid status value" });
//         }

//         // Only allow updates by doctors this summary was delivered to
//         const query = { _id: id, "deliveredTo.doctor": req.user._id };

//         // Build update doc
//         const update = { $set: { status } };

//         if (status === "Resolved") {
//             update.$set.resolvedBy = req.user._id;
//             update.$set.resolvedAt = new Date();
//         } else {
//             // Moving away from Resolved clears stamps
//             update.$unset = { resolvedBy: "", resolvedAt: "" };
//         }

//         const summary = await BotSummary.findOneAndUpdate(query, update, {
//             new: true,
//         })
//             .populate(["user", "patient"])
//             .populate("deliveredTo.doctor");

//         if (!summary) {
//             return res.status(404).json({ message: "Summary not found" });
//         }

//         return res.json({ summary });
//     } catch (err) {
//         console.error("updateSummaryStatus error", err);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// };

export const getSummariesById = async (req, res) => {
    const summaryId = req.params.id;

    try {
        if (req.user.role === 'patient') {
            // GET SUMMARIES FOR PATIENT BY ID BEGIN HERE <---------------------------------

            const summary = await BotSummary.findOne({ user: req.user._id, _id: summaryId }).select('-surgerySiteImages.cid');

            if (!summary) return res.status(404).json({ message: "Requested Summary Not found!" });
            res.status(200).json({ summary });
            // GET SUMMARIES FOR PATIENT BY ID ENDS HERE <----------------------------------
        }

    } catch (error) {
        console.log("getSummaryById controller in the server had a problem: ", error);
    }

}

export const updateSummaryById = async (req, res) => {
    try {
        // console.log("updateSummaryById controller called successfully!")

        if (req.user.role === 'doctor') {
            const { id } = req.params;
            const { status } = req.body;

            const allowed = ["New", "UnderReview", "Resolved"];
            if (!allowed.includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }

            // Only allow updates by doctors this summary was delivered to
            const query = { _id: id, "deliveredTo.doctor": req.user._id };

            // Build update doc
            const update = { $set: { status } };

            if (status === "Resolved") {
                update.$set.resolvedBy = req.user._id;
                update.$set.resolvedAt = new Date();
            } else {
                // Moving away from Resolved clears stamps
                update.$unset = { resolvedBy: "", resolvedAt: "" };
            }

            const summary = await BotSummary.findOneAndUpdate(query, update, {
                new: true,
            })
                .populate(["user", "patient"])
                .populate("deliveredTo.doctor");

            if (!summary) {
                return res.status(404).json({ message: "Summary not found" });
            }

            return res.json({ summary });

            // END OF DOCTOR UPDATING SUMMARY LOGIC! ----------------------------------


        } else if (req.user.role === 'patient') {

            // PATIENT UPDATING THE SUMMARY LOGIC BEGINS HERE <-------------------------


            const summaryId = req.params.id;
            const { deleteImages } = req.body;

            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // fetch summary
            const botSummary = await BotSummary.findOne({ user: req.user._id, _id: summaryId, createdAt: { $gte: startOfToday } });
            if (!botSummary) return res.status(404).json({ message: "No summaries made Today!" });


            if (deleteImages) {
                let urlsToDelete = [];
                urlsToDelete = deleteImages;
                // Get all matching images from DB
                const matchedImages = botSummary.surgerySiteImages.filter(img =>
                    urlsToDelete.includes(img.url)
                );

                // Extract their CIDs for unpinning
                const cidsToDelete = matchedImages.map(img => img.cid);

                // Unpin each CID from Pinata
                await Promise.all(
                    cidsToDelete.map(async (cid) => {
                        try {
                            await pinata.unpin(cid);
                            console.log(`Unpinned ${cid}`);
                        } catch (err) {
                            console.warn(`Failed to unpin ${cid}:`, err.message);
                        }
                    })
                );

                // Remove the matching images from DB
                botSummary.surgerySiteImages = botSummary.surgerySiteImages.filter(
                    img => !urlsToDelete.includes(img.url)
                );

                await botSummary.save();
            }


            // Handle new uploads
            if (req.files?.surgerySiteImages?.length > 0) {
                const uploadPromises = req.files.surgerySiteImages.map(async (file) => {
                    const blob = new Blob([file.buffer]);
                    const pinataFile = {
                        stream: () => blob.stream(),
                        name: file.originalname,
                    };

                    const result = await pinata.upload.file(pinataFile);
                    const cid = result.cid || result.IpfsHash;
                    const url = `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`;

                    return { cid, url };
                });

                const uploadedImages = await Promise.all(uploadPromises);

                // Append to existing ones
                botSummary.surgerySiteImages.push(...uploadedImages);
                await botSummary.save();
            }

            return res.status(200).json({
                message: "Summary updated successfully.",
                surgerySiteImages: botSummary.surgerySiteImages,
            });

            // END OF PATIENT UPDATING THE SUMMARY LOGIC -------------------------------


            // const userId = req.user._id.toString(); // from the verified token
            // const { deleteImages } = req.body; // from the client request body
            // const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // const botSummary = await BotSummary.findOne({ patient: userId, createdAt: { $gte: startOfToday } })

            // if (!botSummary) return res.status(400).json({ message: 'No journals made today!' })

            // if (deleteImages) {

            // }

            // let surgerySiteImages = [];

            // if (req.files && req.files.surgerySiteImages && req.files.surgerySiteImages.length > 0) {

            //     console.log("Image file detected. Uploading to Pinata...");
            //     // Create an array of upload promises
            //     const uploadPromises = req.files.surgerySiteImages.map(async (file) => {
            //         const blob = new Blob([file.buffer]); // Create a Blob from the file buffer

            //         const pinataFile = {             // Create the 'File'-like object Pinata needs
            //             stream: () => blob.stream(),
            //             name: file.originalname,
            //         };

            //         const pinataResponse = await pinata.upload.file(pinataFile);

            //         console.log(`Uploaded Image is: https://${process.env.PINATA_GATEWAY}/ipfs/${pinataResponse.cid}`);
            //         return `https://${process.env.PINATA_GATEWAY}/ipfs/${pinataResponse.cid}`;
            //     });

            //     // upload all the images
            //     surgerySiteImages = await Promise.all(uploadPromises);

            //     botSummary.surgerySiteImages.push(...surgerySiteImages)
            //     botSummary.save();

            //     return res.status(200).json({
            //         message: 'uploaded successfully',
            //     });
            // }
        }

    } catch (error) {
        console.log("updatesummaryById controller in the server had a problem: ", error);
    }
}