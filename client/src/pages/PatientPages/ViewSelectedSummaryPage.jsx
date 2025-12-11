import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { X, UploadCloud } from "lucide-react";

// IMPORTANT: change this path to your actual zustand store file
import { useSummaryStore } from "../../store/useSummaryStore";

export default function ViewSelectedSummaryPage() {
    const { summaryId } = useParams();
    const navigate = useNavigate();

    // destructure the store as requested
    const { selectedSummary, getSummaryById, updateSurgeryImages } = useSummaryStore();

    const [loading, setLoading] = useState(false);
    const [localFiles, setLocalFiles] = useState([]); // { file, previewUrl }
    const [urlsToDeleteSet, setUrlsToDeleteSet] = useState(new Set()); // selected urls for deletion
    const [modified, setModified] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Quick derived counts (make it impossible to miss changes)
    const pendingUploads = localFiles.length;
    const pendingDeletes = urlsToDeleteSet.size;
    const pendingChanges = pendingUploads + pendingDeletes;

    // load summary on mount (and when summaryId changes)
    useEffect(() => {
        if (!summaryId) return;
        (async () => {
            try {
                setLoading(true);
                await getSummaryById(summaryId);
            } catch (err) {
                console.error("Failed to load summary:", err);
                toast.error("Failed to fetch summary");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summaryId]);

    // When selectedSummary changes, reset local state selections
    useEffect(() => {
        // revoke previous previews
        localFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
        setLocalFiles([]);
        setUrlsToDeleteSet(new Set());
        setModified(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSummary]);

    // derived existing images (array of { cid, url })
    const existingImages = useMemo(() => selectedSummary?.surgerySiteImages || [], [selectedSummary]);

    // file input change -> create previews
    const onFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const newFiles = files.map((file) => {
            const previewUrl = URL.createObjectURL(file);
            return { file, previewUrl };
        });
        setLocalFiles((prev) => [...prev, ...newFiles]);
        setModified(true);
        // clear input value to allow re-adding same file later
        e.target.value = null;
    };

    // remove a file from localFiles (preview)
    const removeLocalFile = (idx) => {
        const f = localFiles[idx];
        if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
        setLocalFiles((prev) => prev.filter((_, i) => i !== idx));
        setModified(true);
    };

    // toggle delete selection for an existing image url
    const toggleDeleteUrl = (url) => {
        setUrlsToDeleteSet((prev) => {
            const next = new Set(prev);
            if (next.has(url)) next.delete(url);
            else next.add(url);
            setModified(true);
            return next;
        });
    };

    // Helper: build FormData for files + deleteImages
    const buildFormDataForFiles = (filesArr, deleteImagesArr = []) => {
        const fd = new FormData();
        // append files under the exact field your backend multer expects
        filesArr.forEach((fObj) => {
            fd.append("surgerySiteImages", fObj.file); // multiple entries with same field name
        });
        // backend expects deleteImages as strings — send as JSON string field
        fd.append("deleteImages", JSON.stringify(deleteImagesArr || []));
        return fd;
    };

    // submit handler: call zustand updateSurgeryImages(formData, summaryId)
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!summaryId) return toast.error("Missing summary id");
        if (!modified) return toast("No changes to save");

        const deleteImages = Array.from(urlsToDeleteSet); // array of URLs to delete

        setLoading(true);
        try {
            // Build a FormData instance (even if no files present — deleteImages still sent)
            const formData = buildFormDataForFiles(localFiles, deleteImages);

            // Call only the zustand store function which sends the multipart request
            await updateSurgeryImages(formData, summaryId);

            // toast.success("Images updated");

            // refresh the summary in the store
            await getSummaryById(summaryId);

            // cleanup previews & selections
            localFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
            setLocalFiles([]);
            setUrlsToDeleteSet(new Set());
            setModified(false);
        } catch (err) {
            console.error("Failed to update images:", err);
            toast.error("Failed to update images");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedSummary) {
        return (
            <div className="p-6 pt-[80px] flex justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!selectedSummary) {
        return (
            <div className="p-6 pt-[80px]">
                <p>No summary selected or it was not found.</p>
            </div>
        );
    }

    // helper renderers for modal content
    const renderContentItems = () => {
        const content = selectedSummary?.content;
        if (!content) return <div className="text-sm text-gray-500">No content available.</div>;

        // content might be array or string
        if (Array.isArray(content)) {
            return content.map((c, i) => (
                <div key={i} className="p-3 border rounded-lg bg-base-100 mb-2">
                    <div className="text-xs text-gray-500 mb-1">Entry {i + 1}</div>
                    <div className="whitespace-pre-wrap text-sm md:text-base">{c}</div>
                </div>
            ));
        }

        return (
            <div className="p-3 border rounded-lg bg-base-100">
                <div className="whitespace-pre-wrap text-sm md:text-base">{String(content)}</div>
            </div>
        );
    };

    const renderQuestions = () => {
        const questions = selectedSummary?.questionsAsked;
        if (!Array.isArray(questions) || questions.length === 0) {
            return <div className="text-sm text-gray-500">No questions recorded.</div>;
        }
        return questions.map((q, i) => (
            <div key={i} className="p-3 border rounded-lg bg-base-100 mb-2">
                <div className="text-xs text-gray-500 mb-1">Q{String(i + 1).padStart(2, "0")}</div>
                <div className="text-sm md:text-base">{q}</div>
            </div>
        ));
    };

    // Render the page
    return (
        // Added responsive padding (px-4 on mobile, px-6 on desktop) and wrapper
        <div className="w-full h-full mx-auto px-4 md:px-6 pt-[70px] md:pt-[80px] pb-10">

            {/* Header - Stacks vertically on mobile */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold">View Summary</h1>
                    <div className="text-xs md:text-sm text-gray-500 mt-1">
                        {selectedSummary?.formattedTimestamps?.[0] ?? (selectedSummary?.createdAt ? new Date(selectedSummary.createdAt).toLocaleString() : "")}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm flex-1 md:flex-none"
                        onClick={() => setShowModal(true)}
                        title="View content & questions"
                    >
                        View content & questions
                    </button>

                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} title="Back">
                        Back
                    </button>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Display summary metadata (disabled inputs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSummary.resolvedBy &&
                        <label className="form-control w-full">
                            <div className="label pt-0">
                                <span className="label-text">Resolved By</span>
                            </div>
                            <input className="input input-bordered w-full" value={selectedSummary.resolvedBy || ""} disabled />
                        </label>
                    }
                    <label className="form-control w-full">
                        <div className="label pt-0">
                            <span className="label-text">Status</span>
                        </div>
                        <input className="input input-bordered w-full" value={selectedSummary.status || ""} disabled />
                    </label>

                    <label className="form-control w-full">
                        <div className="label pt-0">
                            <span className="label-text">Doctor: {selectedSummary?.assignedDoctor?.fullName}</span>
                        </div>
                        <input
                            className="input input-bordered w-full"
                            value={selectedSummary.assignedDoctorProfile ? selectedSummary?.assignedDoctorProfile?.doctorId : ""}
                            disabled
                        />
                    </label>

                    <label className="form-control w-full">
                        <div className="label pt-0">
                            <span className="label-text">Revisions</span>
                        </div>
                        <input className="input input-bordered w-full" value={selectedSummary.revision ?? 0} disabled />
                    </label>
                </div>

                {/* Existing images list with checkboxes */}
                <div>
                    <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                        <h2 className="text-base md:text-lg font-medium">Surgery Site Images</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs md:text-sm text-gray-500">{existingImages.length} image(s)</span>
                            <span className="badge badge-info badge-sm">To update only</span>
                        </div>
                    </div>

                    {existingImages.length === 0 && (
                        <div className="p-4 border rounded-md text-sm text-gray-600 bg-base-100">No images uploaded yet.</div>
                    )}

                    {/* Adjusted grid for mobile (2 cols) and desktop (4 cols) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {existingImages.map((img, idx) => {
                            const checked = urlsToDeleteSet.has(img.url);
                            return (
                                <div key={img.cid || img.url || idx} className="relative border rounded-lg overflow-hidden shadow-sm">
                                    <img
                                        src={img.url}
                                        alt={`surgery-${idx}`}
                                        className="w-full h-32 md:h-40 object-cover"
                                        onError={(e) => {
                                            e.target.src = "/placeholder-image.png";
                                        }}
                                    />
                                    <div className="p-2 flex items-center justify-between bg-base-200/90">
                                        <label className="flex items-center gap-2 cursor-pointer w-full">
                                            <input type="checkbox" checked={checked} onChange={() => toggleDeleteUrl(img.url)} className="checkbox checkbox-sm bg-base-100" />
                                            <span className="text-[10px] md:text-xs">Delete?</span>
                                        </label>
                                        <button type="button" className="btn btn-square btn-ghost btn-xs" title="View full" onClick={() => window.open(img.url, "_blank")}>
                                            <UploadCloud size={14} />
                                        </button>
                                    </div>
                                    {checked && <div className="absolute inset-0 bg-red-500/20 pointer-events-none" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* New uploads preview */}
                <div className="pt-4 border-t border-base-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h2 className="text-base md:text-lg font-medium flex items-center gap-2">
                            Upload New Images
                        </h2>

                        <div className="text-xs md:text-sm text-gray-500">
                            <span>Pending deletes: <strong>{pendingDeletes}</strong></span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <label className="btn btn-outline btn-sm">
                            <input type="file" accept="image/*" multiple onChange={onFilesChange} className="hidden" />
                            <UploadCloud size={16} className="mr-1" /> Choose files
                        </label>

                        {localFiles.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-sm btn-error"
                                onClick={() => {
                                    // clear previews
                                    localFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
                                    setLocalFiles([]);
                                    setModified(true);
                                }}
                            >
                                <X size={16} className="mr-1" /> Clear
                            </button>
                        )}
                    </div>

                    {localFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {localFiles.map((fObj, i) => (
                                <div key={i} className="relative border rounded-lg overflow-hidden shadow-sm group">
                                    <img src={fObj.previewUrl} alt={fObj.file.name} className="w-full h-28 md:h-32 object-cover" />
                                    <div className="absolute top-1 right-1">
                                        <button type="button" className="btn btn-circle btn-xs btn-error shadow-md" title="Remove" onClick={() => removeLocalFile(i)}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <div className="p-1 bg-white">
                                        <div className="text-[10px] text-center truncate px-1 text-gray-600">{fObj.file.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse md:flex-row items-center gap-3 pt-4 pb-8">
                    <div className="text-xs text-gray-500 md:hidden w-full text-center">
                        <span>Last updated:</span>{" "}
                        <span className="font-medium">{selectedSummary.updatedAt ? new Date(selectedSummary.updatedAt).toLocaleString() : "—"}</span>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            className="btn btn-ghost flex-1 md:flex-none"
                            onClick={() => {
                                localFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
                                setLocalFiles([]);
                                setUrlsToDeleteSet(new Set());
                                setModified(false);
                                toast("Changes cleared");
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" className={`btn btn-primary flex-1 md:flex-none ${loading ? "loading" : ""}`} disabled={loading}>
                            Save changes
                        </button>
                    </div>

                    <div className="hidden md:block ml-auto text-sm text-gray-500">
                        <span>Last updated:</span>{" "}
                        <span className="font-medium">{selectedSummary.updatedAt ? new Date(selectedSummary.updatedAt).toLocaleString() : "—"}</span>
                    </div>
                </div>
            </form>

            {/* Mobile Friendly Modal */}
            {showModal && (
                <div className="modal modal-open items-center justify-center z-[9999]">
                    <div className="modal-box w-11/12 max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b flex items-start justify-between bg-base-100">
                            <div>
                                <h3 className="font-bold text-lg">Summary content</h3>
                                <p className="text-xs text-gray-500 mt-1">{selectedSummary?.formattedTimestamps?.[0] ?? ""}</p>
                            </div>
                            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium mb-2 bg-base-100 z-10 py-1">Content</h4>
                                    <div className="space-y-3">{renderContentItems()}</div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2 bg-base-100 z-10 py-1">Questions asked</h4>
                                    <div className="space-y-3">{renderQuestions()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t bg-base-100 flex justify-end">
                            <button className="btn btn-primary btn-sm md:btn-md" onClick={() => setShowModal(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/50" onClick={() => setShowModal(false)} />
                </div>
            )}
        </div>
    );
}