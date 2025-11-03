// 2. Format it into a clean string for the bot
export function formatMedicalHistory(profile) {
    let history = "\n\n--- Patient Medical Record ---\n\n";

    // Helper to format the status - this is important for the bot
    const getStatus = (item) => `(Status: ${item.status})`;

    if (profile.chronicConditions?.length > 0) {
        history += "Chronic Conditions:\n";
        profile.chronicConditions.forEach(c => {
            history += `- ${c.conditionName} ${getStatus(c)}\n`;
            if (c.diagnosisDate) history += `  (Diagnosed: ${c.diagnosisDate.toDateString()})\n`;
            if (c.notes) history += `  (Notes: ${c.notes})\n`;
        });
        history += "\n";
    }

    if (profile.pastSurgeries?.length > 0) {
        history += "Past Surgeries:\n";
        profile.pastSurgeries.forEach(s => {
            history += `- ${s.procedureName} ${getStatus(s)}\n`;
            if (s.procedureDate) history += `  (Date: ${s.procedureDate.toDateString()})\n`;
            if (s.notes) history += `  (Notes: ${s.notes})\n`;
        });
        history += "\n";
    }

    if (profile.allergies?.length > 0) {
        history += "Allergies:\n";
        profile.allergies.forEach(a => {
            history += `- ${a.allergen} (Severity: ${a.severity || 'N/A'}, Reaction: ${a.reaction || 'N/A'}) ${getStatus(a)}\n`;
        });
        history += "\n";
    }

    if (profile.currentMedications?.length > 0) {
        history += "Current Medications:\n";
        profile.currentMedications.forEach(m => {
            history += `- ${m.medicationName} (${m.dosage || 'N/A'}, ${m.frequency || 'N/A'}) ${getStatus(m)}\n`;
            if (m.reason) history += `  (Reason: ${m.reason})\n`;
        });
        history += "\n";
    }

    if (profile.familyHistory?.length > 0) {
        history += "Family History:\n";
        profile.familyHistory.forEach(f => {
            history += `- ${f.relation}: ${f.condition} ${getStatus(f)}\n`;
        });
        history += "\n";
    }

    if (history === "--- Patient Medical Record ---\n\n") {
        history += "No medical history on file.\n";
    }

    history += "-------------------------------\n";
    return history;
}

// Example of what the output will look like:
/*
--- Patient Medical Record ---

Chronic Conditions:
- Type 2 Diabetes (Status: Verified)
  (Diagnosed: Tue Jan 15 2019)
  (Notes: Controlled with diet)
- Asthma (Status: Patient-Reported)

Past Surgeries:
- Appendectomy (Status: Verified)
  (Date: Fri Jun 10 2011)
  (Notes: City Hospital, Dr. Smith)

Allergies:
- Penicillin (Severity: Severe, Reaction: Anaphylaxis) (Status: Verified)
- Peanuts (Severity: Mild, Reaction: Rash) (Status: Patient-Reported)

Current Medications:
- Lisinopril (10mg, Once daily) (Status: Verified)
  (Reason: For hypertension)

Family History:
- Mother: Heart Disease (Status: Patient-Reported)
- Father: Type 2 Diabetes (Status: Verified)

-------------------------------
*/