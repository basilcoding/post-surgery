import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import axios from "axios";

import { Edit, Trash, Plus } from "lucide-react";

import { useProfileStore } from "../../store/useProfileStore";
import { useRelationshipsStore } from "../../store/useRelationshipsStore";

// Doctor view/edit page for an individual patient using relationship data fetched from zustand
// Requirements implemented:
// - Fetch relationship using getRelationshipById from useRelationshipsStore (Zustand)
// - Patient ID, name, careType, surgeryName, familyHistory and pastSurgeries are shown but disabled
// - On submit, build payload that EXCLUDES the disabled fields: send only allergies, chronicConditions, currentMedications and notes + surgeryIdentifier
// - Uses DaisyUI classes and lucide-react icons

export default function ViewIndividualPatient({ relationship: propRelationship }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { relationshipId } = useParams();

    const { getRelationshipById, updateRelationshipById } = useRelationshipsStore();
    const { updateProfileById } = useProfileStore();

    const [relationship, setRelationship] = useState(propRelationship || (location.state && location.state.relationship) || null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [form, setForm] = useState(() => ({
        // editable fields
        surgeryIdentifier: "",
        notes: "",
        // arrays (editable)
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        // disabled/read-only fields mirrored for display
        email: "",
        fullName: "",
        patientId: "",
        surgeryName: "",
        careType: "",
        familyHistory: [],
        pastSurgeries: [],
    }));

    useEffect(() => {
        // fetch relationship via zustand getter only
        const fetchRelation = async () => {
            if (!relationshipId) return;
            setFetching(true);
            try {
                const res = await getRelationshipById(relationshipId);
                // getRelationshipById (as provided) returns res.data from axios — handle both shapes
                const rel = res?.relationship || res || null;
                setRelationship(rel);

                const p = rel?.patient || rel?.patientProfile?.user || rel?.patientProfile || {};

                setForm({
                    email: p?.email || "",
                    surgeryIdentifier: rel?.surgeryIdentifier || "",
                    notes: rel?.notes || "",
                    allergies: rel?.patientProfile?.allergies ? structuredClone(rel.patientProfile.allergies) : [],
                    chronicConditions: rel?.patientProfile?.chronicConditions ? structuredClone(rel.patientProfile.chronicConditions) : [],
                    currentMedications: rel?.patientProfile?.currentMedications ? structuredClone(rel.patientProfile.currentMedications) : [],
                    // disabled/display-only fields
                    fullName: p?.fullName || "",
                    patientId: rel?.patientProfile?.patientId || "",
                    surgeryName: rel?.surgeryName || "",
                    careType: rel?.careType || "",
                    familyHistory: rel?.patientProfile?.familyHistory ? structuredClone(rel.patientProfile.familyHistory) : [],
                    pastSurgeries: rel?.patientProfile?.pastSurgeries ? structuredClone(rel.patientProfile.pastSurgeries) : [],
                });
            } catch (err) {
                console.error("Failed to load relationship", err);
                toast.error("Failed to load patient data.");
            } finally {
                setFetching(false);
            }
        };

        // Only fetch if we don't already have propRelationship
        if (!propRelationship) fetchRelation();
        else {
            // if propRelationship provided, mirror to state
            const rel = propRelationship;
            setRelationship(rel);
            const p = rel?.patient || rel?.patientProfile?.user || rel?.patientProfile || {};
            setForm((_) => ({
                email: p?.email || "",
                surgeryIdentifier: rel?.surgeryIdentifier || "",
                notes: rel?.notes || "",
                allergies: rel?.patientProfile?.allergies ? structuredClone(rel.patientProfile.allergies) : [],
                chronicConditions: rel?.patientProfile?.chronicConditions ? structuredClone(rel.patientProfile.chronicConditions) : [],
                currentMedications: rel?.patientProfile?.currentMedications ? structuredClone(rel.patientProfile.currentMedications) : [],
                fullName: p?.fullName || "",
                patientId: rel?.patientProfile?.patientId || "",
                surgeryName: rel?.surgeryName || "",
                careType: rel?.careType || "",
                familyHistory: rel?.patientProfile?.familyHistory ? structuredClone(rel.patientProfile.familyHistory) : [],
                pastSurgeries: rel?.patientProfile?.pastSurgeries ? structuredClone(rel.patientProfile.pastSurgeries) : [],
            }));
        }
    }, [relationshipId, propRelationship, getRelationshipById]);

    // Generic helpers to update arrays of objects
    function updateArray(path, index, key, value) {
        setForm((prev) => {
            const arr = [...(prev[path] || [])];
            arr[index] = { ...(arr[index] || {}), [key]: value };
            return { ...prev, [path]: arr };
        });
    }

    function addArrayItem(path, template = {}) {
        setForm((prev) => ({ ...prev, [path]: [...(prev[path] || []), template] }));
    }

    function removeArrayItem(path, index) {
        setForm((prev) => {
            const arr = [...(prev[path] || [])];
            arr.splice(index, 1);
            return { ...prev, [path]: arr };
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        // console.log('relationship state value in viewindividualPatientPage is: ', relationship);
        if (!relationship || !relationship._id) {
            toast.error("Missing relationship ID — cannot save.");
            return;
        }

        setLoading(true);
        try {
            // Build payload excluding disabled fields as requested
            const payload = {
                // DO NOT send patientId, familyHistory, pastSurgeries (disabled)
                allergies: form.allergies,
                chronicConditions: form.chronicConditions,
                currentMedications: form.currentMedications,
                // Only include surgeryIdentifier and notes (surgeryName & careType are explicitly excluded)
                surgeryIdentifier: form.surgeryIdentifier,
                notes: form.notes,
            };
            let [updatedRelationship, updatedProfile] = await Promise.all([
                updateRelationshipById(relationshipId, payload),
                updateProfileById(relationship.patientProfile._id, payload)
            ]);
            updatedRelationship.patientProfile = updatedProfile;
            const res = updatedRelationship;

            toast.success("Patient information updated.");
            // update local state with returned data if available
            if (res) {
                setRelationship(res);
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to save updates.");
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <div className="p-6">
                <div className="alert alert-info">Loading patient...</div>
            </div>
        );
    }

    if (!relationship && !relationshipId) {
        return (
            <div className="p-6">
                <div className="alert alert-info">No patient data provided. Navigate from the relationships list.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto mt-[50px]">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Patient details — {form.fullName || "Unnamed"}</h1>
                <div className="flex gap-2">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost">Back</button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="card bg-base-100 shadow p-4">
                    <h2 className="text-lg font-medium mb-2">Basic info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="input-group">
                            <span className="w-36">Full name</span>
                            <input
                                value={form.fullName}
                                disabled
                                className="input input-bordered w-full bg-base-200"
                            />
                        </label>

                        <label className="input-group">
                            <span className="w-36">Email</span>
                            <input
                                value={form.email}
                                // onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                disabled
                                className="input input-bordered w-full"
                                type="email"
                            />
                        </label>

                        <label className="input-group">
                            <span className="w-36">Patient ID</span>
                            <input
                                value={form.patientId}
                                disabled
                                className="input input-bordered w-full bg-base-200"
                            />
                        </label>

                        <label className="input-group">
                            <span className="w-36">Surgery</span>
                            <input
                                value={form.surgeryName}
                                disabled
                                className="input input-bordered w-full bg-base-200"
                            />
                        </label>

                        <label className="input-group">
                            <span className="w-36">Care type</span>
                            <input
                                value={form.careType}
                                disabled
                                className="input input-bordered w-full bg-base-200"
                            />
                        </label>

                        <label className="input-group">
                            <span className="w-36">Surgery Versioning</span>
                            <input
                                value={form.surgeryIdentifier}
                                onChange={(e) => setForm((p) => ({ ...p, surgeryIdentifier: e.target.value }))}
                                className="input input-bordered w-full"
                            />
                        </label>

                        <label className="input-group md:col-span-2">
                            <span className="w-36">Notes</span>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                                className="textarea textarea-bordered w-full"
                            />
                        </label>
                    </div>
                </section>

                {/* Allergies */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Allergies</h2>
                        <button type="button" onClick={() => addArrayItem("allergies", { allergen: "", reaction: "", severity: "", notes: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline">
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.allergies.length === 0 && <div className="text-sm text-muted">No allergies recorded.</div>}
                        {form.allergies.map((a, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                <input
                                    placeholder="Allergen"
                                    value={a.allergen || ""}
                                    onChange={(e) => updateArray("allergies", i, "allergen", e.target.value)}
                                    className="input input-bordered col-span-2"
                                />
                                <input
                                    placeholder="Reaction"
                                    value={a.reaction || ""}
                                    onChange={(e) => updateArray("allergies", i, "reaction", e.target.value)}
                                    className="input input-bordered col-span-2"
                                />
                                <input
                                    placeholder="Severity"
                                    value={a.severity || ""}
                                    onChange={(e) => updateArray("allergies", i, "severity", e.target.value)}
                                    className="input input-bordered col-span-1"
                                />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("allergies", i)} className="btn btn-sm btn-error">
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Notes"
                                    value={a.notes || ""}
                                    onChange={(e) => updateArray("allergies", i, "notes", e.target.value)}
                                    className="textarea textarea-sm textarea-bordered md:col-span-6"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Chronic conditions */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Chronic conditions</h2>
                        <button type="button" onClick={() => addArrayItem("chronicConditions", { conditionName: "", diagnosisDate: "", notes: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline">
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.chronicConditions.length === 0 && <div className="text-sm text-muted">No chronic conditions recorded.</div>}
                        {form.chronicConditions.map((c, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                <input placeholder="Condition" value={c.conditionName || ""} onChange={(e) => updateArray("chronicConditions", i, "conditionName", e.target.value)} className="input input-bordered col-span-2" />
                                <input type="date" value={c.diagnosisDate ? c.diagnosisDate.split("T")[0] : ""} onChange={(e) => updateArray("chronicConditions", i, "diagnosisDate", e.target.value)} className="input input-bordered col-span-2" />
                                <input placeholder="Status" value={c.status || ""} onChange={(e) => updateArray("chronicConditions", i, "status", e.target.value)} className="input input-bordered col-span-1" />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("chronicConditions", i)} className="btn btn-sm btn-error">
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <textarea placeholder="Notes" value={c.notes || ""} onChange={(e) => updateArray("chronicConditions", i, "notes", e.target.value)} className="textarea textarea-sm textarea-bordered md:col-span-6" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Current medications */}
                <section className="card bg-base-100 shadow p-4 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Current medications</h2>
                        <button type="button" onClick={() => addArrayItem("currentMedications", { medicationName: "", dosage: "", frequency: "", reason: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline">
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.currentMedications.length === 0 && <div className="text-sm text-muted">No medications recorded.</div>}
                        {form.currentMedications.map((m, i) => (
                            <div key={i} className="w-full grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                <input placeholder="Medication" value={m.medicationName || ""} onChange={(e) => updateArray("currentMedications", i, "medicationName", e.target.value)} className="input input-bordered col-span-2 w-full" />
                                <input placeholder="Dosage" value={m.dosage || ""} onChange={(e) => updateArray("currentMedications", i, "dosage", e.target.value)} className="input input-bordered col-span-1" />
                                <input placeholder="Frequency" value={m.frequency || ""} onChange={(e) => updateArray("currentMedications", i, "frequency", e.target.value)} className="input input-bordered col-span-1" />
                                <input placeholder="Reason" value={m.reason || ""} onChange={(e) => updateArray("currentMedications", i, "reason", e.target.value)} className="input input-bordered col-span-2 w-full" />
                                <div className="flex gap-2 w-full col-span-2 justify-end">
                                    <button type="button" onClick={() => removeArrayItem("currentMedications", i)} className="btn btn-sm btn-error">
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Family history (display-only) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Family history</h2>
                    </div>

                    <div className="space-y-3">
                        {form.familyHistory.length === 0 && <div className="text-sm text-muted">No family history recorded.</div>}
                        {form.familyHistory.map((f, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                <input value={f.relation || ""} disabled className="input input-bordered col-span-2 bg-base-200" />
                                <input value={f.condition || ""} disabled className="input input-bordered col-span-3 bg-base-200" />
                                <textarea value={f.notes || ""} disabled className="textarea textarea-sm textarea-bordered md:col-span-6 bg-base-200" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Past surgeries (display-only) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Past surgeries</h2>
                    </div>

                    <div className="space-y-3">
                        {form.pastSurgeries.length === 0 && <div className="text-sm text-muted">No past surgeries recorded.</div>}
                        {form.pastSurgeries.map((s, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                <input value={s.procedureName || ""} disabled className="input input-bordered col-span-3 bg-base-200" />
                                <input value={s.procedureDate ? s.procedureDate.split("T")[0] : ""} disabled className="input input-bordered col-span-2 bg-base-200" />
                                <textarea value={s.notes || ""} disabled className="textarea textarea-sm textarea-bordered md:col-span-6 bg-base-200" />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost">Cancel</button>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
