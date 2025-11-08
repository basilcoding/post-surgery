export function formatTimestampLabel(ts) {
    try {
        const date = new Date(ts);
        if (isNaN(date.getTime())) throw new Error("Invalid timestamp");

        const options = {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            day: "numeric",
            month: "short",
            year: "numeric"
        };
        return `[${date.toLocaleString("en-US", options).replace(",", "")}]`;
    } catch {
        const now = new Date();
        const options = {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            day: "numeric",
            month: "short",
            year: "numeric"
        };
        return `[${now.toLocaleString("en-US", options).replace(",", "")}]`;
    }
}
