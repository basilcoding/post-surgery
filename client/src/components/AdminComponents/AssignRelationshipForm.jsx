// components/AssignRelationshipForm.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";

import { useAdminStore } from "../../store/useAdminStore.js";
import { useUserStore } from "../../store/useUserStore.js";

import SearchableInput from "../CommonComponents/SearchableInput.jsx";

const AssignRelationshipForm = () => {
    const [doctor, setDoctor] = useState(null);
    const [patient, setPatient] = useState(null);
    const [notes, setNotes] = useState("");
    const [resetFormInput, setResetFormInput] = useState(false);

    const { fetchDoctors, fetchPatients } = useUserStore();
    const { assignRelationship, isAssigning } = useAdminStore();

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!doctor || !patient) return toast.error("Select both doctor and patient");

        const result = await assignRelationship({
            doctorId: doctor._id,
            patientId: patient._id,
            notes,
        });

        if (result) {
            setDoctor(null);
            setPatient(null);
            setNotes("");
            setResetFormInput(true);
        }
        // flip the boolean so child always detects change
        setResetFormInput(prev => !prev);
    }

    return (
        <div className="space-y-6 border p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-4">Assign Doctor to Patient</h2>
            <form onSubmit={handleAssign} className="space-y-4" >

                {/* Doctor search field */}
                <SearchableInput
                    type='dropdown'
                    searchPlaceholder="Search a Doctor..."
                    fetchFunction={fetchDoctors}
                    selectedUser={(doc) => setDoctor(doc)}
                    resetSignal={resetFormInput}
                />
                {/* Patient search field */}
                <SearchableInput
                    type='dropdown'
                    searchPlaceholder="Search a Patient..."
                    fetchFunction={fetchPatients}
                    selectedUser={(pat) => setPatient(pat)}
                    resetSignal={resetFormInput}
                />

                {/* Notes */}
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="textarea textarea-bordered w-full"
                    placeholder="Notes (optional)"
                />

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-secondary w-full"
                    disabled={isAssigning}
                >
                    {isAssigning ? "Assigning..." : "Assign Doctor"}
                </button>
            </form>
        </div>
    );
};

export default AssignRelationshipForm;
