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

            toast.success("Images updated");

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
            <div className="p-6">
                <p>Loading summary...</p>
            </div>
        );
    }

    if (!selectedSummary) {
        return (
            <div className="p-6">
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
                <div key={i} className="p-3 border rounded-lg bg-base-100">
                    <div className="text-xs text-gray-500 mb-1">Entry {i + 1}</div>
                    <div className="whitespace-pre-wrap">{c}</div>
                </div>
            ));
        }

        return (
            <div className="p-3 border rounded-lg bg-base-100">
                <div className="whitespace-pre-wrap">{String(content)}</div>
            </div>
        );
    };

    const renderQuestions = () => {
        const questions = selectedSummary?.questionsAsked;
        if (!Array.isArray(questions) || questions.length === 0) {
            return <div className="text-sm text-gray-500">No questions recorded.</div>;
        }
        return questions.map((q, i) => (
            <div key={i} className="p-3 border rounded-lg bg-base-100">
                <div className="text-xs text-gray-500 mb-1">Q{String(i + 1).padStart(2, "0")}</div>
                <div>{q}</div>
            </div>
        ));
    };

    // Render the page
    return (
        <div className="max-w-4xl mx-auto p-6 pt-[80px]">

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">View Summary</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        {selectedSummary?.formattedTimestamps?.[0] ?? (selectedSummary?.createdAt ? new Date(selectedSummary.createdAt).toLocaleString() : "")}
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setShowModal(true)}
                        title="View content & questions"
                    >
                        View content & questions
                    </button>

                    <button className="btn btn-ghost" onClick={() => navigate(-1)} title="Back">
                        Back
                    </button>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Display summary metadata (disabled inputs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSummary.resolvedBy &&
                        <label className="form-control">
                            <div className="flex items-center justify-between">
                                <span className="label-text">Resolved By</span>
                            </div>
                            <input className="input input-bordered" value={selectedSummary.resolvedBy || ""} disabled />
                        </label>
                    }
                    <label className="form-control">
                        <div className="flex items-center justify-between">
                            <span className="label-text">Status</span>
                        </div>
                        <input className="input input-bordered" value={selectedSummary.status || ""} disabled />
                    </label>
                    {/* {(selectedSummary?.deliveredTo?.length > 1) && selectedSummary.deliveredTo.map((s) => {
                        return <span>{s.doctor._id === selectedSummary.assignedDoctor._id && s.doctor._id}</span>
                    })} */}

                    <label className="form-control">
                        <div className="flex items-center justify-between">
                            <span className="label-text">Doctor: {selectedSummary?.assignedDoctor?.fullName}</span>
                        </div>
                        <input
                            className="input input-bordered"
                            value={selectedSummary.assignedDoctorProfile ? selectedSummary?.assignedDoctorProfile?.doctorId : ""}
                            disabled
                        />
                    </label>

                    <label className="form-control">
                        <div className="flex items-center justify-between">
                            <span className="label-text">Revisions</span>
                        </div>
                        <input className="input input-bordered" value={selectedSummary.revision ?? 0} disabled />
                    </label>
                </div>

                {/* Existing images list with checkboxes */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium">Surgery Site Images</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{existingImages.length} image(s)</span>
                            <span className="badge badge-info">To update only</span>
                        </div>
                    </div>

                    {existingImages.length === 0 && (
                        <div className="p-4 border rounded-md text-sm text-gray-600">No images uploaded yet.</div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingImages.map((img, idx) => {
                            const checked = urlsToDeleteSet.has(img.url);
                            return (
                                <div key={img.cid || img.url || idx} className="relative border rounded overflow-hidden">
                                    <img
                                        src={img.url}
                                        alt={`surgery-${idx}`}
                                        className="w-full h-40 object-cover"
                                        onError={(e) => {
                                            e.target.src = "/placeholder-image.png";
                                        }}
                                    />
                                    <div className="p-2 flex items-center justify-between bg-base-200">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={checked} onChange={() => toggleDeleteUrl(img.url)} className="checkbox bg-black/10" />
                                            <span className="text-xs">Select to delete</span>{/* <span className="text-xs truncate max-w-[8rem]">{img.url.split("/").pop()}</span> */}
                                        </label>
                                        <button type="button" className="btn btn-square btn-ghost" title="View full" onClick={() => window.open(img.url, "_blank")}>
                                            <UploadCloud size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* New uploads preview */}
                <div>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium flex items-center gap-3">
                            Upload New Images
                        </h2>

                        <div className="text-sm text-gray-500">
                            <span className="mr-3">Pending deletes: <strong>{pendingDeletes}</strong></span>
                        </div>
                    </div>

                    <div className="mt-2 flex gap-2 items-center">
                        <label className="btn btn-outline btn-sm">
                            <input type="file" accept="image/*" multiple onChange={onFilesChange} className="hidden" />
                            <UploadCloud className="mr-2" /> Choose files
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
                                <X className="mr-2" /> Clear
                            </button>
                        )}
                    </div>

                    {localFiles.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                            {localFiles.map((fObj, i) => (
                                <div key={i} className="relative border rounded overflow-hidden">
                                    <img src={fObj.previewUrl} alt={fObj.file.name} className="w-full h-32 object-cover" />
                                    <div className="absolute top-1 right-1">
                                        <button type="button" className="btn btn-square btn-xs btn-ghost" title="Remove" onClick={() => removeLocalFile(i)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="p-2">
                                        <div className="text-xs truncate">{fObj.file.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* actions */}
                <div className="flex items-center gap-3">
                    <button type="submit" className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
                        Save changes
                    </button>

                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                            // reset local state to initial summary
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

                    <div className="ml-auto text-sm text-gray-500">
                        <span>Last updated:</span>{" "}
                        <span className="font-medium">{selectedSummary.updatedAt ? new Date(selectedSummary.updatedAt).toLocaleString() : "—"}</span>
                    </div>
                </div>
            </form>

            {/* Modal: content + questions */}
            {showModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-lg">Summary content</h3>
                                <p className="text-sm text-gray-500">{selectedSummary?.formattedTimestamps?.[0] ?? ""}</p>
                            </div>
                            <div>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium mb-2">Content</h4>
                                <div className="space-y-3 max-h-96 overflow-auto pr-2">{renderContentItems()}</div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Questions asked</h4>
                                <div className="space-y-3 max-h-96 overflow-auto pr-2">{renderQuestions()}</div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowModal(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
