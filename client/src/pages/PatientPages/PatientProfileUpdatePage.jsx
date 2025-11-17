import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Plus, Trash, Save, ChevronLeft } from "lucide-react";
import { useProfileStore } from "../../store/useProfileStore";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * PatientProfileUpdatePage.jsx
 * - Patient-centric UI to view & update their own profile.
 * - Submits multipart/form-data (supports profile picture upload).
 * - Uses updateSelfProfile from useProfileStore; sends FormData when a file is present.
 * - Client-side validation: required fullName/email, valid email format, date checks (no future dates).
 * - NOTE: Chronic Conditions & Past Surgeries are READ-ONLY in this view.
 */

export default function PatientProfileUpdatePage() {
    const navigate = useNavigate();
    const { userProfile, setUpdatedProfile, updateSelfProfile, getSelfProfile } = useProfileStore();
    const { authUser, setUpdatedUser } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        patientId: "",
        profilePicFile: null,
        profilePicPreview: "",
        allergies: [],
        chronicConditions: [], // Kept for display
        currentMedications: [],
        familyHistory: [],
        pastSurgeries: [], // Kept for display
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!userProfile) return;
        const user = authUser || {};
        setForm({
            fullName: user.fullName || "",
            email: user.email || "",
            patientId: userProfile.patientId || "",
            profilePicFile: null,
            profilePicPreview: user?.profilePic || "",
            allergies: userProfile.allergies ? structuredClone(userProfile.allergies) : [],
            chronicConditions: userProfile.chronicConditions ? structuredClone(userProfile.chronicConditions) : [],
            currentMedications: userProfile.currentMedications ? structuredClone(userProfile.currentMedications) : [],
            familyHistory: userProfile.familyHistory ? structuredClone(userProfile.familyHistory) : [],
            pastSurgeries: userProfile.pastSurgeries ? structuredClone(userProfile.pastSurgeries) : [],
        });
        setErrors({});
    }, [userProfile]);

    // Simple email validator
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // NOTE: This function is no longer used by validate() but kept for potential future use
    function isFutureDate(dateStr) {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const today = new Date();
        d.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return d > today;
    }

    function validate() {
        const e = {};
        if (!form.fullName || String(form.fullName).trim() === "") e.fullName = "Full name is required.";
        if (!form.email || String(form.email).trim() === "") e.email = "Email is required.";
        else if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";

        // --- REMOVED ---
        // Validation for chronicConditions and pastSurgeries removed as they are read-only.

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    // array helpers (used for sections that are still editable)
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

    function handleProfilePicChange(e) {
        const file = e.target.files?.[0] || null;
        if (!file) {
            setForm((p) => ({ ...p, profilePicFile: null, profilePicPreview: userProfile?.user?.profilePic || "" }));
            return;
        }
        const url = URL.createObjectURL(file);
        setForm((p) => ({ ...p, profilePicFile: file, profilePicPreview: url }));
    }

    async function handleSubmit(ev) {
        ev.preventDefault();
        if (!validate()) {
            toast.error("Fix validation errors before saving.");
            return;
        }

        setLoading(true);
        try {
            let payload;
            if (form.profilePicFile) {
                payload = new FormData();
                payload.append("user[fullName]", form.fullName);
                payload.append("user[email]", form.email);
                payload.append("patientId", form.patientId || "");
                payload.append("profilePic", form.profilePicFile);
                payload.append("allergies", JSON.stringify(form.allergies || []));
                payload.append("currentMedications", JSON.stringify(form.currentMedications || []));
                payload.append("familyHistory", JSON.stringify(form.familyHistory || []));

                // --- REMOVED ---
                // payload.append("chronicConditions", ...);
                // payload.append("pastSurgeries", ...);

            } else {
                payload = {
                    user: { fullName: form.fullName, email: form.email },
                    patientId: form.patientId,
                    allergies: form.allergies,
                    currentMedications: form.currentMedications,
                    familyHistory: form.familyHistory,

                    // --- REMOVED ---
                    // chronicConditions: form.chronicConditions,
                    // pastSurgeries: form.pastSurgeries,
                };
            }

            const res = await updateSelfProfile(payload);

            //udpate the store with the latest values
            if (res && res.user && res.profile) {
                // Update the authUser store
                setUpdatedUser(res.user)
                
                // Update the profile store (merging the new user data in)
                setUpdatedProfile(res.profile);

                // Clear the staged profile pic file from the form
                setForm(p => ({ ...p, profilePicFile: null }));
            }

            toast.success("Profile updated successfully.");

            if (res) {
                const updatedProfile = res.user || res;
                if (updatedProfile?.profilePic) setForm((p) => ({ ...p, profilePicPreview: updatedProfile.profilePic }));
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.message || err?.response?.data?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
                    <ChevronLeft size={16} /> Back
                </button>
                <h1 className="text-2xl font-semibold">Your profile</h1>
                <span className="ml-auto text-sm text-muted">Last saved: {userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleString() : "—"}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact & picture */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-72 flex flex-col items-center gap-3">
                            <div className="w-40 h-40 rounded-full bg-base-200 overflow-hidden flex items-center justify-center">
                                {form.profilePicPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={form.profilePicPreview} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-sm text-muted">No photo</div>
                                )}
                            </div>

                            <input type="file" accept="image/*" onChange={handleProfilePicChange} className="file-input file-input-bordered w-full max-w-xs" />
                            <div className="text-xs text-muted mt-1">Profile picture (optional). Max 5MB recommended.</div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-lg font-medium mb-2">Contact</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <label className="input-group">
                                    <span className="w-32">Full name</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
                                        value={form.fullName}
                                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                                    />
                                </label>

                                <label className="input-group">
                                    <span className="w-32">Email</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                    />
                                </label>

                                <label className="input-group">
                                    <span className="w-32">Patient ID</span>
                                    <input className="input input-bordered w-full bg-base-200" value={form.patientId} disabled />
                                </label>
                            </div>

                            <div className="mt-2 text-sm text-error">
                                {Object.values(errors).slice(0, 3).map((err, i) => (<div key={i}>{err}</div>))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Allergies */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Allergies</h2>
                        <button type="button" onClick={() => addArrayItem("allergies", { allergen: "", reaction: "", severity: "", notes: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline">
                            <Plus size={14} /> Add allergy
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.allergies.length === 0 && <div className="text-sm text-muted">No allergies recorded.</div>}
                        {form.allergies.map((a, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                <input placeholder="Allergen" value={a.allergen || ""} onChange={(e) => updateArray("allergies", i, "allergen", e.target.value)} className="input input-bordered col-span-2" />
                                <input placeholder="Reaction" value={a.reaction || ""} onChange={(e) => updateArray("allergies", i, "reaction", e.target.value)} className="input input-bordered col-span-2" />
                                <input placeholder="Severity" value={a.severity || ""} onChange={(e) => updateArray("allergies", i, "severity", e.target.value)} className="input input-bordered col-span-1" />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("allergies", i)} className="btn btn-sm btn-error"><Trash size={14} /></button>
                                </div>
                                <textarea placeholder="Notes" value={a.notes || ""} onChange={(e) => updateArray("allergies", i, "notes", e.target.value)} className="textarea textarea-sm textarea-bordered md:col-span-6" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Chronic conditions (READ-ONLY) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Chronic conditions</h2>
                        {/* --- MODIFIED: Button is disabled --- */}
                        <button type="button" onClick={() => addArrayItem("chronicConditions", { conditionName: "", diagnosisDate: "", notes: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline" disabled>
                            <Plus size={14} /> Add condition
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.chronicConditions.length === 0 && <div className="text-sm text-muted">No chronic conditions recorded.</div>}
                        {form.chronicConditions.map((c, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                {/* --- MODIFIED: Fields are disabled --- */}
                                <input placeholder="Condition" value={c.conditionName || ""} onChange={(e) => updateArray("chronicConditions", i, "conditionName", e.target.value)} className="input input-bordered col-span-2" disabled />
                                <input type="date" value={c.diagnosisDate ? c.diagnosisDate.split("T")[0] : ""} onChange={(e) => updateArray("chronicConditions", i, "diagnosisDate", e.target.value)} className={`input input-bordered col-span-2 ${errors[`chronicConditions.${i}.diagnosisDate`] ? "input-error" : ""}`} disabled />
                                <input placeholder="Status" value={c.status || ""} onChange={(e) => updateArray("chronicConditions", i, "status", e.target.value)} className="input input-bordered col-span-1" disabled />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("chronicConditions", i)} className="btn btn-sm btn-error" disabled><Trash size={14} /></button>
                                </div>
                                <textarea placeholder="Notes" value={c.notes || ""} onChange={(e) => updateArray("chronicConditions", i, "notes", e.target.value)} className="textarea textarea-sm textarea-bordered md:col-span-6" disabled />
                                {errors[`chronicConditions.${i}.diagnosisDate`] && <div className="text-sm text-error md:col-span-6">{errors[`chronicConditions.${i}.diagnosisDate`]}</div>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Current medications */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Current medications</h2>
                        <button type="button" onClick={() => addArrayItem("currentMedications", { medicationName: "", dosage: "", frequency: "", reason: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline">
                            <Plus size={14} /> Add med
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.currentMedications.length === 0 && <div className="text-sm text-muted">No medications recorded.</div>}
                        {form.currentMedications.map((m, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                <input placeholder="Medication" value={m.medicationName || ""} onChange={(e) => updateArray("currentMedications", i, "medicationName", e.target.value)} className="input input-bordered col-span-2" />
                                <input placeholder="Dosage" value={m.dosage || ""} onChange={(e) => updateArray("currentMedications", i, "dosage", e.target.value)} className="input input-bordered col-span-1" />
                                <input placeholder="Frequency" value={m.frequency || ""} onChange={(e) => updateArray("currentMedications", i, "frequency", e.target.value)} className="input input-bordered col-span-1" />
                                <input placeholder="Reason" value={m.reason || ""} onChange={(e) => updateArray("currentMedications", i, "reason", e.target.value)} className="input input-bordered col-span-1" />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("currentMedications", i)} className="btn btn-sm btn-error"><Trash size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Family history */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Family history</h2>
                        <button type="button" onClick={() => addArrayItem("familyHistory", { relation: "", condition: "", notes: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline">
                            <Plus size={14} /> Add entry
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.familyHistory.length === 0 && <div className="text-sm text-muted">No family history recorded.</div>}
                        {form.familyHistory.map((f, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                <input placeholder="Relation" value={f.relation || ""} onChange={(e) => updateArray("familyHistory", i, "relation", e.target.value)} className="input input-bordered col-span-2" />
                                <input placeholder="Condition" value={f.condition || ""} onChange={(e) => updateArray("familyHistory", i, "condition", e.target.value)} className="input input-bordered col-span-3" />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("familyHistory", i)} className="btn btn-sm btn-error"><Trash size={14} /></button>
                                </div>
                                <textarea placeholder="Notes" value={f.notes || ""} onChange={(e) => updateArray("familyHistory", i, "notes", e.target.value)} className="textarea textarea-sm textarea-bordered md:col-span-6" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Past surgeries (READ-ONLY) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Past surgeries</h2>
                        {/* --- MODIFIED: Button is disabled --- */}
                        <button type="button" onClick={() => addArrayItem("pastSurgeries", { procedureName: "", procedureDate: "", notes: "", status: "Patient-Reported" })} className="btn btn-sm btn-outline" disabled>
                            <Plus size={14} /> Add surgery
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.pastSurgeries.length === 0 && <div className="text-sm text-muted">No past surgeries recorded.</div>}
                        {form.pastSurgeries.map((s, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                {/* --- MODIFIED: Fields are disabled --- */}
                                <input placeholder="Procedure" value={s.procedureName || ""} onChange={(e) => updateArray("pastSurgeries", i, "procedureName", e.target.value)} className="input input-bordered col-span-3" disabled />
                                <input type="date" value={s.procedureDate ? s.procedureDate.split("T")[0] : ""} onChange={(e) => updateArray("pastSurgeries", i, "procedureDate", e.target.value)} className={`input input-bordered col-span-2 ${errors[`pastSurgeries.${i}.procedureDate`] ? "input-error" : ""}`} disabled />
                                <div className="flex gap-2 col-span-1">
                                    <button type="button" onClick={() => removeArrayItem("pastSurgeries", i)} className="btn btn-sm btn-error" disabled><Trash size={14} /></button>
                                </div>
                                <textarea placeholder="Notes" value={s.notes || ""} onChange={(e) => updateArray("pastSurgeries", i, "notes", e.target.value)} className="textarea textarea-sm textarea-bordered md:col-span-6" disabled />
                                {errors[`pastSurgeries.${i}.procedureDate`] && <div className="text-sm text-error md:col-span-6">{errors[`pastSurgeries.${i}.procedureDate`]}</div>}
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setForm((_) => ({
                            ..._,
                            fullName: userProfile?.user?.fullName || "",
                            email: userProfile?.user?.email || "",
                        }))}
                        className="btn btn-ghost"
                    >
                        Revert name/email
                    </button>

                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? "Saving..." : <><Save size={14} /> Save changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
}