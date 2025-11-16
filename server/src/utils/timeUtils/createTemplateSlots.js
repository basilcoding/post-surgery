// utils/createTemplateSlots.js
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";
import { format } from "date-fns";

/**
 * createTemplateSlots({
 *   workingSlots: [{ day: 0..6, slots: ["HH:mm", ...] }],
 *   date: "YYYY-MM-DD",
 *   timezone: "Asia/Kolkata",
 *   slotDurationMins: 30
 * })
 *
 * RETURNS: [{ hhmm, startISO, endISO }]
 */
// export function createTemplateSlots({
//     workingSlots = [],
//     date,
//     timezone = "UTC",
// }) {
//     if (!date) return [];

//     // Convert "2025-11-14" → Date object in doctor's timezone
//     const dayStartInTz = utcToZonedTime(new Date(`${date}T00:00:00Z`), timezone);
//     const weekday = dayStartInTz.getDay(); // 0 = Sunday … 6 = Saturday

//     // Get slots for this weekday
//     const entries = (workingSlots || []).filter(e =>
//         e.day === weekday ||
//         e.day === null ||
//         e.day === undefined
//     );

//     const result = [];

//     for (const e of entries) {
//         for (const hhmm of e.slots || []) {
//             // Build local dateTime for slot start in doctor's timezone
//             const [h, m] = hhmm.split(":").map(Number);
            
//             result.push({
//                 hhmm,
//             });
//         }
//     }

//     // Sort by start time
//     result.sort((a, b) => new Date(a.startISO) - new Date(b.startISO));

//     return result;
// }
