export function formatOldSummary(oldSummary) {
    if (!oldSummary) return "";

    const lines = [];

    // Optional meta
    if (oldSummary.createdAt) {
        lines.push(`
IMPORTANT CONTEXT:
The following is the existing journal summary and question history for this patient and doctor today.
These are ALREADY stored and MUST NOT be modified, rewritten, or included again in your output **but you may mention them if required in the new summary**.

When generating the new JSON:
- The "content" array must still contain exactly ONE string, which is a summary of ONLY the NEW information in the recent messages that is NOT already covered by the existing summary content.
- Do NOT repeat or rephrase sentences that are already present in the existing summary content.
- The "followUpQuestions" array must ONLY contain follow-up questions that are NOT already listed in the "Existing follow-up questions" section above.
Here are the Existing journal summary for this patient & doctor (already stored, DO NOT modify):\n
`
        );
        lines.push(""); // blank line
    }

    // Previous bot notes / content
    if (Array.isArray(oldSummary.content) && oldSummary.content.length > 0) {
        lines.push("Existing summary content (already stored, do NOT repeat):\n");
        oldSummary.content.forEach((item, idx) => {
            lines.push(`${idx + 1}. ${item}`);
        });
        lines.push("");
    }

    // Questions already asked
    if (Array.isArray(oldSummary.questionsAsked) && oldSummary.questionsAsked.length > 0) {
        lines.push(
            "Existing follow-up questions for this patient and doctor today (ALREADY asked; DO NOT include these again in followUpQuestions):\n"
        );
        oldSummary.questionsAsked.forEach((q, idx) => {
            lines.push(`- ${q}`);
        });
        lines.push("");
    }

    // If nothing meaningful, just return empty string
    const result = lines.join("\n").trim();
    return result.length > 0 ? result : "";
}
