// DoctorProfileUpdatePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Plus,
    Trash,
    Save,
    ChevronLeft,
    UploadCloud,
    FileText
} from "lucide-react";

import { useProfileStore } from "../../store/useProfileStore";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * Always send FormData:
 * FormData {
 *   jsonData: JSON.stringify({...all non-file fields..., deleteImages: [...], hospitalAddress: {...}, clinicAddress: {...}}),
 *   profilePic: <File> (optional),
 *   documents: <File> (multiple, optional)
 * }
 *
 * Immutable UI for: languages, education, hospital address (clinicAddress still sent to backend).
 */

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DoctorProfileUpdatePage() {
    const navigate = useNavigate();
    const { userProfile, setUpdatedProfile, updateSelfProfile } = useProfileStore();
    const { authUser, setUpdatedUser } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [deleteImages, setDeleteImages] = useState([]);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        doctorId: "",
        specialty: "",
        licenseNumber: "",
        yearsOfExperience: 0,
        bio: "",
        profilePicFile: null,
        profilePicPreview: "",
        clinicAddress: { street: "", city: "", state: "", zipCode: "", country: "" }, // backend key
        education: [],
        languages: [],
        documentsMeta: [], // existing docs from server
        documentFiles: [], // new files to upload
        workingSlots: [] // [{ day: 0..6, slots: ["HH:mm"] }]
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!userProfile) return;
        const user = authUser || {};
        // Normalize workingSlots from profile or create an empty template for 7 days
        const existingWorking = Array.isArray(userProfile.workingSlots) ? userProfile.workingSlots : [];
        // Ensure workingSlots has entries only for days that exist in profile; we keep as-is
        setForm({
            fullName: user.fullName || "",
            email: user.email || "",
            doctorId: userProfile.doctorId || "",
            specialty: userProfile.specialty || "",
            licenseNumber: userProfile.licenseNumber || "",
            yearsOfExperience: userProfile.yearsOfExperience ?? 0,
            bio: userProfile.bio || "",
            profilePicFile: null,
            profilePicPreview: user?.profilePic || "",
            clinicAddress: userProfile.clinicAddress ? structuredClone(userProfile.clinicAddress) : { street: "", city: "", state: "", zipCode: "", country: "" },
            education: userProfile.education ? structuredClone(userProfile.education) : [],
            languages: userProfile.languages ? structuredClone(userProfile.languages) : [],
            documentsMeta: userProfile.documents ? structuredClone(userProfile.documents) : [],
            documentFiles: [],
            workingSlots: existingWorking.map(w => ({
                day: typeof w.day === "number" ? w.day : null,
                slots: Array.isArray(w.slots) ? w.slots.map(s => String(s)) : []
            }))
        });
        setErrors({});
        setDeleteImages([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile]);

    // Validation helpers
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function isNonNegativeInteger(v) {
        if (v === null || v === undefined || v === "") return false;
        const n = Number(v);
        return Number.isInteger(n) && n >= 0;
    }

    function validate() {
        const e = {};
        if (!form.fullName || String(form.fullName).trim() === "") e.fullName = "Full name is required.";
        if (!form.email || String(form.email).trim() === "") e.email = "Email is required.";
        else if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";

        // if (!form.doctorId || String(form.doctorId).trim() === "") e.doctorId = "Doctor ID is required.";
        if (!form.specialty || String(form.specialty).trim() === "") e.specialty = "Specialty is required.";
        // if (!form.licenseNumber || String(form.licenseNumber).trim() === "") e.licenseNumber = "License number is required.";

        if (typeof form.yearsOfExperience !== "undefined" && form.yearsOfExperience !== null && form.yearsOfExperience !== "") {
            if (!isNonNegativeInteger(form.yearsOfExperience)) e.yearsOfExperience = "Years of experience should be a non-negative integer.";
        }

        (form.education || []).forEach((ed, i) => {
            if (ed.graduationYear && (!/^\d{4}$/.test(String(ed.graduationYear)) || Number(ed.graduationYear) < 1900 || Number(ed.graduationYear) > new Date().getFullYear())) {
                e[`education.${i}.graduationYear`] = "Enter a valid graduation year.";
            }
        });

        // Basic validation on workingSlots: any enabled day must have at least one slot
        const wsErrors = [];
        (form.workingSlots || []).forEach((w, i) => {
            if (w && Array.isArray(w.slots) && w.slots.length === 0) {
                wsErrors.push(`If day ${w.day} is enabled it should have at least one slot.`);
            }
        });
        if (wsErrors.length) e.workingSlots = wsErrors.join(" ");

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    // Working slots helpers (array-only logic)
    function getSlotsForDay(day) {
        const found = (form.workingSlots || []).find(w => w.day === day);
        return found ? [...found.slots] : [];
    }

    function toggleDayEnabled(day) {
        setForm(prev => {
            const arr = Array.isArray(prev.workingSlots) ? [...prev.workingSlots] : [];
            const idx = arr.findIndex(w => w.day === day);
            if (idx === -1) {
                // enable with one empty default slot
                arr.push({ day, slots: ["09:00"] });
            } else {
                // disable: remove entry
                arr.splice(idx, 1);
            }
            // keep order by day for predictability
            arr.sort((a, b) => (a.day == null ? 7 : a.day) - (b.day == null ? 7 : b.day));
            return { ...prev, workingSlots: arr };
        });
    }

    // New: toggle single slot selection (adds/removes hh:mm in workingSlots for day)
    function toggleSlotForDay(day, hhmm) {
        setForm(prev => {
            const arr = Array.isArray(prev.workingSlots) ? prev.workingSlots.map(w => ({ ...w, slots: Array.isArray(w.slots) ? [...w.slots] : [] })) : [];
            let entry = arr.find(w => w.day === day);
            if (!entry) {
                entry = { day, slots: [] };
                arr.push(entry);
            }
            const idx = entry.slots.findIndex(s => s === hhmm);
            if (idx === -1) {
                entry.slots.push(hhmm);
            } else {
                entry.slots.splice(idx, 1);
            }
            // if no slots left, remove entry entirely
            if (!entry.slots.length) {
                const eidx = arr.findIndex(w => w.day === day);
                if (eidx !== -1) arr.splice(eidx, 1);
            }
            // keep order
            arr.sort((a, b) => (a.day == null ? 7 : a.day) - (b.day == null ? 7 : b.day));
            return { ...prev, workingSlots: arr };
        });
    }

    // helper to check whether a slot is selected
    function isSlotSelected(day, hhmm) {
        const slots = getSlotsForDay(day);
        return slots.includes(hhmm);
    }

    // helper to generate badges from 09:00 to 17:00 in 30-min steps
    function generateDayBadges(start = "09:00", end = "17:00", stepMins = 30) {
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const badges = [];
        for (let t = startMinutes; t < endMinutes; t += stepMins) {
            const hh = Math.floor(t / 60);
            const mm = t % 60;
            const hhmm = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
            badges.push(hhmm);
        }
        return badges;
    }

    // keep legacy helpers (unused elsewhere)
    function addSlotForDay(day) {
        setForm(prev => {
            const arr = Array.isArray(prev.workingSlots) ? [...prev.workingSlots] : [];
            let entry = arr.find(w => w.day === day);
            if (!entry) {
                entry = { day, slots: [] };
                arr.push(entry);
            }
            entry.slots = Array.isArray(entry.slots) ? [...entry.slots, "09:00"] : ["09:00"];
            return { ...prev, workingSlots: arr };
        });
    }

    function updateSlotForDay(day, index, value) {
        // ensure hh:mm formatting is not enforced here, caller provides string
        setForm(prev => {
            const arr = Array.isArray(prev.workingSlots) ? prev.workingSlots.map(w => ({ ...w, slots: Array.isArray(w.slots) ? [...w.slots] : [] })) : [];
            const entry = arr.find(w => w.day === day);
            if (!entry) return prev;
            entry.slots[index] = value;
            return { ...prev, workingSlots: arr };
        });
    }

    function removeSlotForDay(day, index) {
        setForm(prev => {
            const arr = Array.isArray(prev.workingSlots) ? prev.workingSlots.map(w => ({ ...w, slots: Array.isArray(w.slots) ? [...w.slots] : [] })) : [];
            const entry = arr.find(w => w.day === day);
            if (!entry) return prev;
            entry.slots.splice(index, 1);
            // if empty after removal, remove the day entry entirely
            if (!entry.slots.length) {
                const idx = arr.findIndex(w => w.day === day);
                if (idx !== -1) arr.splice(idx, 1);
            }
            return { ...prev, workingSlots: arr };
        });
    }

    function updateArray(path, index, key, value) {
        // kept for other editable arrays if needed (not used for education/languages because they're immutable)
        setForm((prev) => {
            const arr = [...(prev[path] || [])];
            if (key === null) {
                arr[index] = value;
            } else {
                arr[index] = { ...(arr[index] || {}), [key]: value };
            }
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

    function updateClinicAddress(key, value) {
        // clinicAddress/hospitalAddress is immutable in UI — don't call this in UI.
        setForm(prev => ({ ...prev, clinicAddress: { ...(prev.clinicAddress || {}), [key]: value } }));
    }

    // Profile pic handling
    function handleProfilePicChange(e) {
        const file = e.target.files?.[0] || null;
        if (!file) {
            setForm((p) => ({ ...p, profilePicFile: null, profilePicPreview: userProfile?.user?.profilePic || "" }));
            return;
        }
        const url = URL.createObjectURL(file);
        setForm((p) => ({ ...p, profilePicFile: file, profilePicPreview: url }));
    }

    // Documents handling: new files to upload
    function handleDocumentFilesChange(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setForm(prev => ({ ...prev, documentFiles: [...(prev.documentFiles || []), ...files] }));
    }
    function removeNewDocumentFile(index) {
        setForm(prev => {
            const arr = [...(prev.documentFiles || [])];
            arr.splice(index, 1);
            return { ...prev, documentFiles: arr };
        });
    }

    // Remove existing document: mark for deletion and remove from UI
    function handleDeleteExistingDocument(doc) {
        const pid = doc.public_id || doc.publicId || null;
        if (pid) setDeleteImages(prev => [...prev, pid]);
        setForm(prev => ({
            ...prev,
            documentsMeta: prev.documentsMeta.filter(d => (d.public_id || d.publicId) !== pid)
        }));
    }

    // Thumbnail helpers
    function fileExtensionOfUrl(url) {
        if (!url) return "";
        const m = url.split("?")[0].split(".").pop();
        return (m || "").toLowerCase();
    }
    function isImageUrl(url) {
        const ext = fileExtensionOfUrl(url);
        return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
    }
    function isPdfUrl(url) {
        return fileExtensionOfUrl(url) === "pdf";
    }

    // Helper: build jsonData payload (non-file part) — include both clinicAddress and hospitalAddress for compatibility
    function buildJsonPayload() {
        return {
            user: { fullName: form.fullName, email: form.email },
            doctorId: form.doctorId,
            specialty: form.specialty,
            licenseNumber: form.licenseNumber,
            yearsOfExperience: Number.isFinite(Number(form.yearsOfExperience)) ? Number(form.yearsOfExperience) : form.yearsOfExperience,
            bio: form.bio,
            clinicAddress: form.clinicAddress,        // backend expects this
            hospitalAddress: form.clinicAddress,      // new name for UI semantics
            education: form.education,
            languages: form.languages,
            documentsMeta: form.documentsMeta,
            deleteImages, // array of public_ids to be deleted on server
            workingSlots: form.workingSlots // <-- include workingSlots here
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) {
            toast.error("Fix validation errors before saving.");
            return;
        }
        setLoading(true);

        try {
            // Always send FormData with jsonData (so server always has req.body.jsonData)
            const formData = new FormData();
            const jsonData = buildJsonPayload();
            formData.append("jsonData", JSON.stringify(jsonData));

            // Append profile pic if present
            if (form.profilePicFile) {
                formData.append("profilePic", form.profilePicFile);
            }

            // Append each document file as 'documents' (server expects array)
            (form.documentFiles || []).forEach((file) => {
                formData.append("documents", file);
            });

            // Note: do NOT set Content-Type header manually when using axios/fetch with FormData.
            // The browser will set the proper multipart boundary.
            const res = await updateSelfProfile(formData);

            if (res && res.user && res.profile) {
                setUpdatedUser(res.user);
                setUpdatedProfile(res.profile);

                // Clear staged files on success
                setForm(prev => ({ ...prev, profilePicFile: null, documentFiles: [] }));

                // toast.success("Profile updated successfully.");

                if (res.user.profilePic) {
                    setForm(prev => ({ ...prev, profilePicPreview: res.user.profilePic }));
                }
            }
        } catch (err) {
            console.error("Doctor profile update error:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    }

    // Render helpers for immutable lists / address
    function renderEducation() {
        if (!form.education || form.education.length === 0) {
            return <div className="text-sm text-muted">No education entries.</div>;
        }
        return form.education.map((ed, i) => (
            <div key={i} className="p-2 rounded border bg-base-100">
                <div className="font-medium">{ed.degree || "—"}</div>
                <div className="text-sm text-muted">{ed.institution || "—"}</div>
                <div className="text-xs text-muted">{ed.graduationYear || "—"}</div>
            </div>
        ));
    }

    function renderLanguages() {
        if (!form.languages || form.languages.length === 0) {
            return <div className="text-sm text-muted">No languages added.</div>;
        }
        return (
            <div className="flex flex-wrap gap-2">
                {form.languages.map((l, i) => (
                    <span key={i} className="badge">{l}</span>
                ))}
            </div>
        );
    }

    function renderHospitalAddressBlock() {
        const a = form.clinicAddress || {};
        if (!a || (!a.street && !a.city && !a.state && !a.zipCode && !a.country)) {
            return <div className="text-sm text-muted">No hospital address provided.</div>;
        }
        return (
            <div className="space-y-1">
                <div>{a.street}</div>
                <div>{[a.city, a.state, a.zipCode].filter(Boolean).join(", ")}</div>
                <div>{a.country}</div>
            </div>
        );
    }

    // Document thumbnail renderer
    function DocumentThumb({ url, name }) {
        if (!url) {
            const ext = name?.split(".").pop()?.toLowerCase() || "";
            return <div className="w-16 h-12 flex items-center justify-center rounded bg-base-200">{ext || "file"}</div>;
        }
        if (isImageUrl(url)) {
            return <img src={url} alt="doc" className="w-24 h-16 object-cover rounded" />;
        }
        if (isPdfUrl(url)) {
            return (
                <div className="w-24 h-16 flex flex-col items-center justify-center rounded bg-red-100 text-red-700">
                    <div className="font-semibold">PDF</div>
                </div>
            );
        }
        // generic badge with extension
        const ext = fileExtensionOfUrl(url) || (name?.split(".").pop() || "").toUpperCase();
        return (
            <div className="w-24 h-16 flex items-center justify-center rounded bg-base-200 text-sm">
                {ext.toUpperCase()}
            </div>
        );
    }

    // For newly added files produce preview if image
    function NewFileThumb({ file }) {
        const ext = (file.name || "").split(".").pop()?.toLowerCase();
        if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) {
            const url = URL.createObjectURL(file);
            return <img src={url} alt={file.name} className="w-24 h-16 object-cover rounded" />;
        }
        if (ext === "pdf") {
            return (
                <div className="w-24 h-16 flex flex-col items-center justify-center rounded bg-red-100 text-red-700">
                    <div className="font-semibold">PDF</div>
                </div>
            );
        }
        return <div className="w-24 h-16 flex items-center justify-center rounded bg-base-200 text-sm">{(ext || "file").toUpperCase()}</div>;
    }

    return (
        <div className="p-6 pt-[80px] h-full w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 mb-6">
                <h1 className="hidden md:block text-xl md:text-2xl font-semibold w-full">Doctor profile</h1>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={() => navigate(-1)} className="hidden md:inline-flex btn btn-ghost btn-sm px-2 -ml-2">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <div className='w-full flex justify-between md:justify-center'>
                        <h1 className="md:hidden text-xl md:text-2xl font-semibold w-full">Doctor profile</h1>
                        <button onClick={() => navigate(-1)} className="md:hidden btn btn-ghost btn-sm px-2 -ml-2">
                            <ChevronLeft size={16} /> Back
                        </button>
                    </div>
                </div>

                <span className="text-xs md:text-sm text-base-content/60 w-full md:w-auto text-left md:text-right pl-1 md:pl-0">
                    Last saved: {userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleString() : "—"}
                </span>

            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header + picture */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-80 flex flex-col items-center gap-3">
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
                            <h2 className="text-lg font-medium mb-2">Basic info</h2>

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
                                    <span className="w-32">Doctor ID</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.doctorId ? "input-error" : ""}`}
                                        value={form.doctorId}
                                        onChange={(e) => setForm((p) => ({ ...p, doctorId: e.target.value }))}
                                        disabled
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <label className="input-group">
                                    <span className="w-32">Specialty</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.specialty ? "input-error" : ""}`}
                                        value={form.specialty}
                                        onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                                    />
                                </label>

                                <label className="input-group">
                                    <span className="w-32">License #</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.licenseNumber ? "input-error" : ""}`}
                                        value={form.licenseNumber}
                                        onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
                                        disabled
                                    />
                                </label>

                                <label className="input-group">
                                    <span className="w-32">Years exp.</span>
                                    <input
                                        className={`input input-bordered w-full ${errors.yearsOfExperience ? "input-error" : ""}`}
                                        type="number"
                                        min={0}
                                        value={form.yearsOfExperience}
                                        onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: e.target.value }))}
                                    />
                                </label>
                            </div>

                            <div className="mt-3">
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    placeholder="Short bio (optional)"
                                    rows={4}
                                    value={form.bio}
                                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                />
                            </div>

                            <div className="mt-2 text-sm text-error">
                                {Object.values(errors).slice(0, 4).map((err, i) => (<div key={i}>{err}</div>))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Working Slots: new UI */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Working hours</h2>
                        <div className="text-xs text-muted">Select days and add time slots</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Render a panel per weekday */}
                        {WEEKDAY_LABELS.map((label, idx) => {
                            const slots = getSlotsForDay(idx);
                            const enabled = slots.length > 0;
                            const badges = generateDayBadges("09:00", "17:00", 30);
                            return (
                                <div key={idx} className="p-3 border rounded bg-base-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                onChange={() => toggleDayEnabled(idx)}
                                                className="checkbox"
                                            />
                                            <div className="font-medium">{label}</div>
                                        </div>

                                        <div className="text-xs text-muted">{enabled ? `${slots.length} slot(s)` : "disabled"}</div>
                                    </div>

                                    {enabled ? (
                                        <>
                                            <div className="grid grid-cols-4 gap-2">
                                                {badges.map((hhmm) => {
                                                    const sel = isSlotSelected(idx, hhmm);
                                                    return (
                                                        <button
                                                            key={hhmm}
                                                            type="button"
                                                            onClick={() => toggleSlotForDay(idx, hhmm)}
                                                            className={`cursor-pointer px-2 py-1 badge text-sm transition-all text-center w-[75%] ${sel ? "badge-primary text-white" : "bg-base-100 text-base-content border-base-200"}`}
                                                        >
                                                            {hhmm}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-muted">Enable day to add slots.</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* small hint */}
                    <div className="mt-3 text-xs text-muted">
                        Slots should be selected from the badges (09:00–16:30). They represent the slot start time in your local timezone.
                    </div>
                </section>

                {/* Hospital address (immutable) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Hospital address</h2>
                        <div className="text-xs text-muted">Read-only</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="md:col-span-3 p-2 border rounded bg-base-100">{renderHospitalAddressBlock()}</div>
                    </div>
                </section>

                {/* Education (immutable) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Education</h2>
                        <div className="text-xs text-muted">Read-only</div>
                    </div>

                    <div className="space-y-3">
                        {renderEducation()}
                    </div>
                </section>

                {/* Languages (immutable) */}
                <section className="card bg-base-100 shadow p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Languages</h2>
                        <div className="text-xs text-muted">Read-only</div>
                    </div>

                    <div>
                        {renderLanguages()}
                    </div>
                </section>

                {/* Documents */}
                <section className="card bg-base-100 shadow p-4 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Documents</h2>
                        <label className="btn btn-sm btn-outline cursor-pointer">
                            <UploadCloud size={14} /> Upload
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple className="hidden" onChange={handleDocumentFilesChange} />
                        </label>
                    </div>

                    <div className="space-y-3">
                        {/* Existing documents meta with thumbnails */}
                        {form.documentsMeta.length === 0 ? (
                            <div className="text-sm text-muted">No documents on file.</div>
                        ) : (
                            form.documentsMeta.map((d, i) => (
                                <div key={d.public_id || i} className="flex items-center gap-3">
                                    <DocumentThumb url={d.url} name={d.url || d.public_id} />
                                    <div className="flex-1">
                                        <a href={d.url} target="_blank" rel="noreferrer" className="link">{d.documentType || `Document ${i + 1}`}</a>
                                        <div className="text-xs text-muted">{d.public_id}</div>
                                        <div className='flex justify-end md:hidden mt-2'>
                                            <button type="button" onClick={() => handleDeleteExistingDocument(d)} className="md:hidden btn btn-sm btn-error"><Trash size={14} /></button>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => handleDeleteExistingDocument(d)} className="hidden md:block btn btn-sm btn-error"><Trash size={14} /></button>
                                </div>
                            ))
                        )}

                        {/* New files staged (with thumbnails) */}
                        {(form.documentFiles || []).length > 0 && (
                            <>
                                <div className="divider" />
                                <div className="text-sm font-medium">Files to upload</div>
                                {form.documentFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <NewFileThumb file={f} />
                                        <div className="flex-1 truncate">{f.name}</div>
                                        <div className="text-xs text-muted">{Math.round(f.size / 1024)} KB</div>
                                        <button type="button" onClick={() => removeNewDocumentFile(i)} className="btn btn-sm btn-error"><Trash size={14} /></button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setForm((prev) => ({
                            ...prev,
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
