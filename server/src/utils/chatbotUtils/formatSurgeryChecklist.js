export function formatSurgeryChecklist(protocol) {
    if (!protocol) {
        return "\n\n--- 2. Surgery-Specific Checklist (The 'What') ---\n(No checklist found for this procedure.)\n---------------------------------------------\n";
    }

    let checklist = `\n\n--- 2. Surgery-Specific Checklist: "${protocol.displayName}" ---\n`;

    protocol.topics.forEach((topic, index) => {
        checklist += `\n${index + 1}. **${topic.topicName}:**\n`;
        topic.items.forEach(item => {
            // This matches the "Topic: ..." format in your prompt
            checklist += `    * Topic: ${item}\n`;
        });
    });

    checklist += "---------------------------------------------\n";
    return checklist;
}