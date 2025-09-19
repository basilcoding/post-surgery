import User from "../models/user.model.js";
import Relationship from "../models/relationship.model.js";

// ADMIN gets all doctors
export const getAllDoctors = async (req, res) => {
    try {
        const { search = "" } = req.query; // get search query from frontend

        // IMPORTANT PLEASE READ AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
        //Your Query	                        What It Means	                                                    Will it find 'smith@example.com'?
        // findOne({})	                        "Get the first document in the collection, no matter what it is."	Only if it happens to be the very first document.
        // findOne({ email: 's' })	            "Find a document where the email field is exactly 's'."	            No ❌
        // findOne({ email: { $regex: 's' } })	"Find a document where the email field contains 's'."	            Yes ✅

        // $regex is used to find a pattern from what we send in the req.search. And ps dont think about using findOne to do this because for eg: findOne({email: 's'}) then it will search for something exactly for email: 's' which is not there in our database
        // And also, $or is used to search for either fullName or email
        // $options: 'i' makes it case-insensitive

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const doctors = await User.find({
            role: "doctor",
            $or: [
                { fullName: { $regex: escapeRegex(search), $options: "i" } }, // case-insensitive
                { email: { $regex: escapeRegex(search), $options: "i" } }
            ]
        }).limit(10); // optional limit for performance

        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error in getDoctors:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// admin gets all patients
export const getAllPatients = async (req, res) => {
    try {
        const { search = "" } = req.query;

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patients = await User.find({
            role: "patient",
            $or: [
                { fullName: { $regex: escapeRegex(search), $options: "i" } },
                { email: { $regex: escapeRegex(search), $options: "i" } }
            ]
        }).limit(10);

        res.status(200).json(patients);
    } catch (error) {
        console.error("Error in getPatients:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// For implementing patient page
export const getPatientProfile = (req, res) => {
    res.json(req.user); // already attached by protectRoute
};

export const getDoctorProfile = async (req, res) => {
    res.json(req.user); // already attached by protectRoute
};


// ----------------> WE COULD IMPLEMENT THIS IN THE FUTURE <----------------
// GET /patients?search=...&page=1&limit=10&all=true
// export const getAllPatients = async (req, res) => {
//   try {
//     // destructure query params from the incoming request (req.query)
//     // `search = ""` -> default empty string if not provided
//     // `page = 1` -> default page number
//     // `limit = 10` -> default page size
//     // `all = "false"` -> default string "false" (we'll normalize later)
//     const { search = "", page = 1, limit = 10, all = "false" } = req.query;

//     // parseInt(page, 10) converts page string to integer (base 10)
//     // Math.max(1, ...) ensures page number is at least 1 (no 0 or negative pages)
//     const pageNum = Math.max(1, parseInt(page, 10));

//     // parseInt(limit, 10) converts the limit string to integer
//     // Math.min(100, ...) caps limit so the client cannot request >100 items
//     // Math.max(1, ...) ensures limit is at least 1
//     const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));

//     // escapeRegex is a helper to escape special regex characters in user input
//     // so that user input is treated as plain text rather than arbitrary regex,
//     // preventing invalid regex patterns and some attacks.
//     const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//     // base database filter that always applies: only users whose role === 'patient'
//     let filter = { role: "patient" };

//     // if `search` contains non-whitespace characters, build a Mongo regex search:
//     // $regex matches a pattern; $options: "i" makes it case-insensitive.
//     // We place the regex inside a $or to match either fullName OR email.
//     if (String(search).trim() !== "") {
//       const regex = { $regex: escapeRegex(search), $options: "i" };
//       filter.$or = [{ fullName: regex }, { email: regex }];
//     } else if (String(all).toLowerCase() === "true") {
//       // if search is empty but `all=true` is passed, keep filter as { role: "patient" }
//       // (explicit request to list all patients, paginated)
//     } else {
//       // No search AND all !== true → we intentionally avoid returning everyone.
//       // Returning empty data signals "no results" to an autocomplete that didn't want "all".
//       return res.status(200).json({ data: [], meta: { total: 0, page: pageNum, limit: pageSize } });
//     }

//     // Execute the MongoDB query:
//     // User.find(filter) -> returns documents matching filter.
//     // .skip(n) -> skip first n documents (used for pagination offset).
//     // .limit(pageSize) -> limit the number of returned docs to pageSize.
//     const patients = await User.find(filter)
//       .skip((pageNum - 1) * pageSize)
//       .limit(pageSize);

//     // countDocuments(filter) -> how many total documents match the filter (for pagination metadata)
//     const total = await User.countDocuments(filter);

//     // Send success response with `data` (the page results) and `meta` (pagination info)
//     res.status(200).json({ data: patients, meta: { total, page: pageNum, limit: pageSize } });
//   } catch (error) {
//     // Catch any runtime errors, log on server, and return generic 500 to client
//     console.error("Error in getPatients:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
