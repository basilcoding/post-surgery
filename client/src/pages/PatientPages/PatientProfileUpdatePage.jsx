import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Plus, Trash, Save, ChevronLeft, FileText, Star } from "lucide-react";
import { useProfileStore } from "../../store/useProfileStore";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * PatientProfileUpdatePage.jsx
 * - Patient-centric UI to view & update their own profile.
 * - Submits multipart/form-data (supports profile picture + documents upload).
 * - Uses updateSelfProfile from useProfileStore; sends FormData when a file or documents are present.
 * - Client-side validation: required fullName/email, valid email format, date checks (no future dates).
 * - Chronic Conditions & Past Surgeries are READ-ONLY in this view.
 * - Documents: can upload new, and mark existing ones for deletion.
 */

export default function PatientProfileUpdatePage() {
    const navigate = useNavigate();
    const { userProfile, setUpdatedProfile, updateSelfProfile } = useProfileStore();
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

    // documentsToDelete: array of existing document URLs to be removed
    const [documentsToDelete, setDocumentsToDelete] = useState([]);
    // newDocuments: files selected on this page that are not yet uploaded
    const [newDocuments, setNewDocuments] = useState([]);
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
        setDocumentsToDelete([]);
        setNewDocuments([]);
    }, [userProfile, authUser]);

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

    // --- Documents helpers ---

    // Add new files to newDocuments list
    function handleDocumentFilesChange(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setNewDocuments((prev) => [
            ...prev,
            ...files.map((file) => ({
                file,
                title: file.name,          // user can override this
                category: "other",
                notes: "",
                isImportant: false,
            })),
        ]);

        // allow selecting the same file again if needed
        e.target.value = "";
    }

    function updateNewDocument(index, key, value) {
        setNewDocuments((prev) => {
            const arr = [...prev];
            arr[index] = { ...arr[index], [key]: value };
            return arr;
        });
    }

    function removeNewDocument(index) {
        setNewDocuments((prev) => prev.filter((_, i) => i !== index));
    }

    // Toggle a document (by URL) for deletion
    function toggleDocumentDelete(url) {
        setDocumentsToDelete((prev) =>
            prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
        );
    }

    // Pretty label for categories in dropdown
    function getCategoryLabel(value) {
        switch (value) {
            case "consultation": return "Consultation";
            case "bill": return "Bill";
            case "lab_report": return "Lab report";
            case "imaging": return "Imaging";
            case "discharge_summary": return "Discharge summary";
            case "prescription": return "Prescription";
            default: return "Other";
        }
    }

    async function handleSubmit(ev) {
        ev.preventDefault();
        if (!validate()) {
            toast.error("Fix validation errors before saving.");
            return;
        }

        setLoading(true);
        try {
            const hasNewDocuments = newDocuments.length > 0;
            const hasDeletions = documentsToDelete.length > 0;

            let payload;

            // Use FormData when we have any files: profile picture OR new documents
            if (form.profilePicFile || hasNewDocuments) {
                payload = new FormData();
                // user fields
                payload.append("user[fullName]", form.fullName);
                payload.append("user[email]", form.email);
                payload.append("patientId", form.patientId || "");

                // profile picture
                if (form.profilePicFile) {
                    payload.append("profilePic", form.profilePicFile);
                }

                // profile arrays as JSON strings (backend parses JSON)
                payload.append("allergies", JSON.stringify(form.allergies || []));
                payload.append("currentMedications", JSON.stringify(form.currentMedications || []));
                payload.append("familyHistory", JSON.stringify(form.familyHistory || []));

                // new documents
                if (hasNewDocuments) {
                    const documentMeta = newDocuments.map((doc) => ({
                        category: doc.category || "other",
                        title: doc.title || "",
                        notes: doc.notes || "",
                        isImportant: !!doc.isImportant,
                    }));

                    newDocuments.forEach((doc) => {
                        payload.append("documents", doc.file);
                    });

                    payload.append("documentMeta", JSON.stringify(documentMeta));
                }

                // deletions (send each URL as its own deleteImages field)
                if (hasDeletions) {
                    documentsToDelete.forEach((url) => {
                        payload.append("deleteImages", url);
                    });
                }
            } else {
                // --- No file is present, so we are in JSON mode ---
                payload = {
                    user: { fullName: form.fullName, email: form.email },
                    patientId: form.patientId,
                    allergies: form.allergies,
                    currentMedications: form.currentMedications,
                    familyHistory: form.familyHistory,
                };

                if (hasDeletions) {
                    // backend expects deleteImages to be an array (or string) of URLs
                    payload.deleteImages = documentsToDelete;
                }
            }

            const res = await updateSelfProfile(payload);

            // update the store with the latest values
            if (res && res.user && res.profile) {
                // Update the authUser store
                setUpdatedUser(res.user);

                // Update the profile store
                setUpdatedProfile(res.profile);

                // Clear staged files / deletions from the form
                setForm((p) => ({ ...p, profilePicFile: null }));
                setNewDocuments([]);
                setDocumentsToDelete([]);
            }

            toast.success("Profile updated successfully.");

            if (res) {
                const updatedProfile = res.user || res;
                if (updatedProfile?.profilePic)
                    setForm((p) => ({ ...p, profilePicPreview: updatedProfile.profilePic }));
            }
        } catch (err) {
            console.error(err);
            toast.error(
                err?.message ||
                err?.response?.data?.message ||
                "Failed to update profile."
            );
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
                <span className="ml-auto text-sm text-muted">
                    Last saved:{" "}
                    {userProfile?.updatedAt
                        ? new Date(userProfile.updatedAt).toLocaleString()
                        : "—"}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact & picture */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-72 flex flex-col items-center gap-3">
                            <div className="w-40 h-40 rounded-full bg-base-200 overflow-hidden flex items-center justify-center">
                                {form.profilePicPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={form.profilePicPreview}
                                        alt="profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-sm text-muted">No photo</div>
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicChange}
                                className="file-input file-input-bordered w-full max-w-xs"
                            />
                            <div className="text-xs text-muted mt-1">
                                Profile picture (optional). Max 5MB recommended.
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-lg font-medium mb-2">Contact</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <label className="input-group">
                                    <span className="w-32">Full name</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""
                                            }`}
                                        value={form.fullName}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, fullName: e.target.value }))
                                        }
                                    />
                                </label>

                                <label className="input-group">
                                    <span className="w-32">Email</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.email ? "input-error" : ""
                                            }`}
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, email: e.target.value }))
                                        }
                                    />
                                </label>

                                <label className="input-group">
                                    <span className="w-32">Patient ID</span>
                                    <input
                                        className="input input-bordered w-full bg-base-200"
                                        value={form.patientId}
                                        disabled
                                    />
                                </label>
                            </div>

                            <div className="mt-2 text-sm text-error">
                                {Object.values(errors)
                                    .slice(0, 3)
                                    .map((err, i) => (
                                        <div key={i}>{err}</div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Documents (upload + delete) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium flex items-center gap-2">
                            <FileText size={18} />
                            Documents
                        </h2>
                        <label className="btn btn-sm btn-outline cursor-pointer">
                            <Plus size={14} /> Add files
                            <input
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={handleDocumentFilesChange}
                            />
                        </label>
                    </div>

                    <div className="space-y-4">
                        {/* Existing documents */}
                        <div>
                            <h3 className="text-sm font-semibold mb-1">
                                Existing documents
                            </h3>
                            {(!userProfile?.documents ||
                                userProfile.documents.length === 0) && (
                                    <div className="text-sm text-muted">
                                        No documents uploaded yet.
                                    </div>
                                )}
                            <div className="space-y-2 h-[250px] overflow-y-auto ">
                                {userProfile?.documents?.map((doc) => {
                                    const marked = documentsToDelete.includes(doc.url);
                                    return (
                                        <div
                                            key={doc.fileId || doc.url}
                                            className={`flex items-start gap-3 border rounded-lg p-2 ${marked ? "opacity-60 bg-base-200" : ""
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm mt-1"
                                                checked={marked}
                                                onChange={() => toggleDocumentDelete(doc.url)}
                                            />
                                            <div className="flex-1">
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="link font-medium flex items-center gap-1"
                                                >
                                                    <FileText size={14} />
                                                    <span>
                                                        {doc.title || "Untitled document"}
                                                    </span>
                                                </a>
                                                <div className="text-xs text-muted mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="badge badge-ghost badge-sm">
                                                        {doc.category || "other"}
                                                    </span>
                                                    {doc.isImportant && (
                                                        <span className="badge badge-warning badge-sm flex items-center gap-1">
                                                            <Star size={10} />
                                                            Important
                                                        </span>
                                                    )}
                                                </div>
                                                {doc.notes && (
                                                    <p className="text-xs mt-1">{doc.notes}</p>
                                                )}
                                                {marked && (
                                                    <p className="text-xs text-error mt-1">
                                                        Will be deleted when you save.
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => toggleDocumentDelete(doc.url)}
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            {userProfile?.documents?.length > 0 && (
                                <p className="text-xs text-muted mt-2">
                                    Select documents to remove; they will be deleted from
                                    storage when you save.
                                </p>
                            )}
                        </div>

                        {/* New uploads (not yet saved) */}
                        {newDocuments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-1">
                                    New uploads (pending save)
                                </h3>
                                <div className="space-y-3">
                                    {newDocuments.map((doc, i) => (
                                        <div
                                            key={i}
                                            className="border rounded-lg p-3 space-y-2"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                                                {/* Title (user-facing title, not file name) */}
                                                <input
                                                    className="input input-bordered md:col-span-2"
                                                    placeholder="Title"
                                                    value={doc.title}
                                                    onChange={(e) =>
                                                        updateNewDocument(
                                                            i,
                                                            "title",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                                {/* DaisyUI dropdown for category */}
                                                <div className="dropdown md:col-span-2">
                                                    <div
                                                        tabIndex={0}
                                                        role="button"
                                                        className="btn btn-outline w-full justify-between"
                                                    >
                                                        <span>{getCategoryLabel(doc.category)}</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 opacity-60"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <ul
                                                        tabIndex={0}
                                                        className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-sm"
                                                    >
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "consultation")
                                                                }
                                                            >
                                                                Consultation
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "bill")
                                                                }
                                                            >
                                                                Bill
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "lab_report")
                                                                }
                                                            >
                                                                Lab report
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "imaging")
                                                                }
                                                            >
                                                                Imaging
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "discharge_summary")
                                                                }
                                                            >
                                                                Discharge summary
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "prescription")
                                                                }
                                                            >
                                                                Prescription
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateNewDocument(i, "category", "other")
                                                                }
                                                            >
                                                                Other
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <label className="label cursor-pointer gap-2 md:justify-end">
                                                    <span className="label-text text-xs">
                                                        Mark important
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={doc.isImportant}
                                                        onChange={(e) =>
                                                            updateNewDocument(
                                                                i,
                                                                "isImportant",
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                </label>
                                            </div>
                                            <textarea
                                                className="textarea textarea-bordered textarea-sm w-full"
                                                placeholder="Notes (optional)"
                                                value={doc.notes}
                                                onChange={(e) =>
                                                    updateNewDocument(i, "notes", e.target.value)
                                                }
                                            />
                                            <div className="flex justify-between items-center text-xs text-muted mt-1">
                                                <span>{doc.file?.name}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => removeNewDocument(i)}
                                                >
                                                    <Trash size={12} /> Remove file
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Allergies */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Allergies</h2>
                        <button
                            type="button"
                            onClick={() =>
                                addArrayItem("allergies", {
                                    allergen: "",
                                    reaction: "",
                                    severity: "",
                                    notes: "",
                                    status: "Patient-Reported",
                                })
                            }
                            className="btn btn-sm btn-outline"
                        >
                            <Plus size={14} /> Add allergy
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.allergies.length === 0 && (
                            <div className="text-sm text-muted">No allergies recorded.</div>
                        )}
                        {form.allergies.map((a, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                            >
                                <input
                                    placeholder="Allergen"
                                    value={a.allergen || ""}
                                    onChange={(e) =>
                                        updateArray("allergies", i, "allergen", e.target.value)
                                    }
                                    className="input input-bordered col-span-2"
                                />
                                <input
                                    placeholder="Reaction"
                                    value={a.reaction || ""}
                                    onChange={(e) =>
                                        updateArray("allergies", i, "reaction", e.target.value)
                                    }
                                    className="input input-bordered col-span-2"
                                />
                                <input
                                    placeholder="Severity"
                                    value={a.severity || ""}
                                    onChange={(e) =>
                                        updateArray("allergies", i, "severity", e.target.value)
                                    }
                                    className="input input-bordered col-span-1"
                                />
                                <div className="flex gap-2 col-span-1">
                                    <button
                                        type="button"
                                        onClick={() => removeArrayItem("allergies", i)}
                                        className="btn btn-sm btn-error"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Notes"
                                    value={a.notes || ""}
                                    onChange={(e) =>
                                        updateArray("allergies", i, "notes", e.target.value)
                                    }
                                    className="textarea textarea-sm textarea-bordered md:col-span-6"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Chronic conditions (READ-ONLY) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Chronic conditions</h2>
                        <button
                            type="button"
                            onClick={() =>
                                addArrayItem("chronicConditions", {
                                    conditionName: "",
                                    diagnosisDate: "",
                                    notes: "",
                                    status: "Patient-Reported",
                                })
                            }
                            className="btn btn-sm btn-outline"
                            disabled
                        >
                            <Plus size={14} /> Add condition
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.chronicConditions.length === 0 && (
                            <div className="text-sm text-muted">
                                No chronic conditions recorded.
                            </div>
                        )}
                        {form.chronicConditions.map((c, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                            >
                                <input
                                    placeholder="Condition"
                                    value={c.conditionName || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "chronicConditions",
                                            i,
                                            "conditionName",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-2"
                                    disabled
                                />
                                <input
                                    type="date"
                                    value={
                                        c.diagnosisDate
                                            ? c.diagnosisDate.split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        updateArray(
                                            "chronicConditions",
                                            i,
                                            "diagnosisDate",
                                            e.target.value
                                        )
                                    }
                                    className={`input input-bordered col-span-2 ${errors[`chronicConditions.${i}.diagnosisDate`]
                                            ? "input-error"
                                            : ""
                                        }`}
                                    disabled
                                />
                                <input
                                    placeholder="Status"
                                    value={c.status || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "chronicConditions",
                                            i,
                                            "status",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-1"
                                    disabled
                                />
                                <div className="flex gap-2 col-span-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeArrayItem("chronicConditions", i)
                                        }
                                        className="btn btn-sm btn-error"
                                        disabled
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Notes"
                                    value={c.notes || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "chronicConditions",
                                            i,
                                            "notes",
                                            e.target.value
                                        )
                                    }
                                    className="textarea textarea-sm textarea-bordered md:col-span-6"
                                    disabled
                                />
                                {errors[`chronicConditions.${i}.diagnosisDate`] && (
                                    <div className="text-sm text-error md:col-span-6">
                                        {errors[`chronicConditions.${i}.diagnosisDate`]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Current medications */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Current medications</h2>
                        <button
                            type="button"
                            onClick={() =>
                                addArrayItem("currentMedications", {
                                    medicationName: "",
                                    dosage: "",
                                    frequency: "",
                                    reason: "",
                                    status: "Patient-Reported",
                                })
                            }
                            className="btn btn-sm btn-outline"
                        >
                            <Plus size={14} /> Add med
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.currentMedications.length === 0 && (
                            <div className="text-sm text-muted">
                                No medications recorded.
                            </div>
                        )}
                        {form.currentMedications.map((m, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                            >
                                <input
                                    placeholder="Medication"
                                    value={m.medicationName || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "currentMedications",
                                            i,
                                            "medicationName",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-2"
                                />
                                <input
                                    placeholder="Dosage"
                                    value={m.dosage || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "currentMedications",
                                            i,
                                            "dosage",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-1"
                                />
                                <input
                                    placeholder="Frequency"
                                    value={m.frequency || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "currentMedications",
                                            i,
                                            "frequency",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-1"
                                />
                                <input
                                    placeholder="Reason"
                                    value={m.reason || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "currentMedications",
                                            i,
                                            "reason",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-1"
                                />
                                <div className="flex gap-2 col-span-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeArrayItem("currentMedications", i)
                                        }
                                        className="btn btn-sm btn-error"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Family history */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Family history</h2>
                        <button
                            type="button"
                            onClick={() =>
                                addArrayItem("familyHistory", {
                                    relation: "",
                                    condition: "",
                                    notes: "",
                                    status: "Patient-Reported",
                                })
                            }
                            className="btn btn-sm btn-outline"
                        >
                            <Plus size={14} /> Add entry
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.familyHistory.length === 0 && (
                            <div className="text-sm text-muted">
                                No family history recorded.
                            </div>
                        )}
                        {form.familyHistory.map((f, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                            >
                                <input
                                    placeholder="Relation"
                                    value={f.relation || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "familyHistory",
                                            i,
                                            "relation",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-2"
                                />
                                <input
                                    placeholder="Condition"
                                    value={f.condition || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "familyHistory",
                                            i,
                                            "condition",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-3"
                                />
                                <div className="flex gap-2 col-span-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeArrayItem("familyHistory", i)
                                        }
                                        className="btn btn-sm btn-error"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Notes"
                                    value={f.notes || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "familyHistory",
                                            i,
                                            "notes",
                                            e.target.value
                                        )
                                    }
                                    className="textarea textarea-sm textarea-bordered md:col-span-6"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Past surgeries (READ-ONLY) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Past surgeries</h2>
                        <button
                            type="button"
                            onClick={() =>
                                addArrayItem("pastSurgeries", {
                                    procedureName: "",
                                    procedureDate: "",
                                    notes: "",
                                    status: "Patient-Reported",
                                })
                            }
                            className="btn btn-sm btn-outline"
                            disabled
                        >
                            <Plus size={14} /> Add surgery
                        </button>
                    </div>

                    <div className="space-y-3">
                        {form.pastSurgeries.length === 0 && (
                            <div className="text-sm text-muted">
                                No past surgeries recorded.
                            </div>
                        )}
                        {form.pastSurgeries.map((s, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"
                            >
                                <input
                                    placeholder="Procedure"
                                    value={s.procedureName || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "pastSurgeries",
                                            i,
                                            "procedureName",
                                            e.target.value
                                        )
                                    }
                                    className="input input-bordered col-span-3"
                                    disabled
                                />
                                <input
                                    type="date"
                                    value={
                                        s.procedureDate
                                            ? s.procedureDate.split("T")[0]
                                            : ""
                                    }
                                    onChange={(e) =>
                                        updateArray(
                                            "pastSurgeries",
                                            i,
                                            "procedureDate",
                                            e.target.value
                                        )
                                    }
                                    className={`input input-bordered col-span-2 ${errors[`pastSurgeries.${i}.procedureDate`]
                                            ? "input-error"
                                            : ""
                                        }`}
                                    disabled
                                />
                                <div className="flex gap-2 col-span-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeArrayItem("pastSurgeries", i)
                                        }
                                        className="btn btn-sm btn-error"
                                        disabled
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Notes"
                                    value={s.notes || ""}
                                    onChange={(e) =>
                                        updateArray(
                                            "pastSurgeries",
                                            i,
                                            "notes",
                                            e.target.value
                                        )
                                    }
                                    className="textarea textarea-sm textarea-bordered md:col-span-6"
                                    disabled
                                />
                                {errors[`pastSurgeries.${i}.procedureDate`] && (
                                    <div className="text-sm text-error md:col-span-6">
                                        {errors[`pastSurgeries.${i}.procedureDate`]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            setForm((_) => ({
                                ..._,
                                fullName: userProfile?.user?.fullName || "",
                                email: userProfile?.user?.email || "",
                            }))
                        }
                        className="btn btn-ghost"
                    >
                        Revert name/email
                    </button>

                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save size={14} /> Save changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
