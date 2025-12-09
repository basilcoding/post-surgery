// UpdateCareCheckListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Download,
  Edit,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

// adjust this import path to your project structure
import { useCareCheckListStore } from "../../store/useCareCheckListStore.js";

/**
 * UpdateCareCheckListPage
 *
 * - Loads an existing checklist by :careCheckListId using getCareCheckListById.
 * - Uses selectedCareCheckList from the store.
 * - Lets the doctor edit surgeryName, identifier, description, relatedSpecialty, topics & items.
 * - Slightly different from Create: shows a "versioning" helper and a "Save as new version" option.
 * - Uses updateCareCheckListById(careCheckListId, formData) from zustand.
 *
 * NOTE: Revert button is wired to call getCareCheckListById(careCheckListId) and will re-populate
 * the form once the store's selectedCareCheckList updates.
 */
export default function UpdateCareCheckListPage() {
  const { careCheckListId } = useParams();
  const navigate = useNavigate();

  const {
    careCheckLists,
    getCareCheckLists,
    getCareCheckListById,
    selectedCareCheckList,
    updateCareCheckListById,
  } = useCareCheckListStore();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // form state
  const [surgeryName, setSurgeryName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [relatedSpecialty, setRelatedSpecialty] = useState("");
  const [topics, setTopics] = useState([]);

  // small differences vs create:
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);
  const [originalMeta, setOriginalMeta] = useState(null);

  // confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  // used to trigger populateForm when revert is requested and the store value arrives
  const [revertRequested, setRevertRequested] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        // fetch the single checklist by id into selectedCareCheckList
        await getCareCheckListById(careCheckListId);
        // populate will happen in the effect watching selectedCareCheckList
      } catch (err) {
        console.error("Failed to load checklist:", err);
        toast.error("Failed to load checklist");
        if (mounted) navigate("/doctor/care-check-lists");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careCheckListId]);

  // populate form when store's selectedCareCheckList changes
  useEffect(() => {
    if (!selectedCareCheckList) return;
    if (String(selectedCareCheckList._id) !== String(careCheckListId)) return;
    populateForm(selectedCareCheckList);

    // if a revert was requested, clear it and show toast
    if (revertRequested) {
      setRevertRequested(false);
      toast.success("Reverted to saved checklist");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCareCheckList, careCheckListId]);

  function populateForm(item) {
    setSurgeryName(item.surgeryName || item.displayName || "");
    setIdentifier(item.identifier || "");
    setDescription(item.description || "");
    setRelatedSpecialty(item.relatedSpecialty || "");
    // normalize topics to internal shape
    setTopics(
      (item.topics || []).map((t, idx) => ({
        id: t._tempId || `t-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        topicName: t.topicName || "",
        items: (t.items || []).map((it, j) => ({
          id: `i-${idx}-${j}-${Math.random().toString(36).slice(2, 4)}`,
          text: it,
        })),
      }))
    );
    setOriginalMeta({
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      _id: item._id,
    });
  }

  function slugify(text = "") {
    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // topics & items helpers
  const addTopic = () =>
    setTopics((t) => [
      ...t,
      { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, topicName: "", items: [{ id: `i-${Date.now()}`, text: "" }] },
    ]);
  const removeTopic = (topicId) => setTopics((t) => t.filter((tp) => tp.id !== topicId));
  const updateTopicName = (topicId, value) => setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, topicName: value } : tp)));

  const addItem = (topicId) =>
    setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, items: [...tp.items, { id: `i-${Date.now()}`, text: "" }] } : tp)));
  const updateItemText = (topicId, itemId, value) => setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, items: tp.items.map((it) => (it.id === itemId ? { ...it, text: value } : it)) } : tp)));
  const removeItem = (topicId, itemId) => setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, items: tp.items.filter((it) => it.id !== itemId) } : tp)));

  const validate = () => {
    if (!surgeryName.trim()) {
      toast.error("Surgery name required");
      return false;
    }
    if (!identifier.trim()) {
      toast.error("Identifier required");
      return false;
    }
    if (!topics.length) {
      toast.error("Add at least one topic");
      return false;
    }
    for (const tp of topics) {
      if (!tp.topicName.trim()) {
        toast.error("Topic names cannot be empty");
        return false;
      }
      if (!tp.items || tp.items.length === 0) {
        toast.error(`Topic "${tp.topicName || "Untitled"}" needs at least one item`);
        return false;
      }
      for (const it of tp.items) {
        if (!it.text.trim()) {
          toast.error("Checklist items cannot be empty");
          return false;
        }
      }
    }
    return true;
  };

  // auto-increment version helper: if identifier ends with -vN, bump N; else append -v2
  function nextVersionIdentifier(current) {
    if (!current) return `${slugify(surgeryName)}-v1`;
    const match = current.match(/-v(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10) + 1;
      return current.replace(/-v(\d+)$/, `-v${n}`);
    }
    return `${current}-v2`;
  }

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    // Build payload
    const payload = {
      surgeryName: surgeryName.trim(),
      identifier: (saveAsNewVersion ? nextVersionIdentifier(identifier.trim()) : identifier.trim()),
      relatedSpecialty: relatedSpecialty.trim() || undefined,
      description: description.trim() || undefined,
      topics: topics.map((tp) => ({ topicName: tp.topicName.trim(), items: tp.items.map((it) => it.text.trim()) })),
    };

    try {
      await updateCareCheckListById(careCheckListId, payload);
      // toast.success(saveAsNewVersion ? "Checklist saved as new version" : "Checklist updated Successfully");
      setConfirmOpen(false);
      navigate("/doctor/care-check-lists");
    } catch (err) {
      console.error("Failed to update checklist:", err);
      toast.error("Failed to update checklist");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revert handler: request single-get and set flag so the effect will re-populate when store updates
  const handleRevert = async () => {
    try {
      setRevertRequested(true);
      await getCareCheckListById(careCheckListId);
      // populate will occur in the selectedCareCheckList effect above
    } catch (err) {
      console.error("Failed to revert:", err);
      toast.error("Failed to revert");
      setRevertRequested(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 pt-[90px]">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-base-200 rounded w-48" />
            <div className="h-6 bg-base-200 rounded w-full" />
            <div className="h-40 bg-base-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full w-full pt-[90px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          {/* Left: Back Button & Title */}
          <div className="flex items-center justify-between gap-3">
            <button className="hidden md:flex btn btn-ghost btn-sm" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="text-xl md:text-2xl font-semibold">Update Care Checklist</h1>
            <button className="md:hidden btn btn-ghost btn-sm" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          {/* Right: Metadata (Stacks below on mobile, moves right on desktop) */}
          {originalMeta && (
            <div className="flex flex-col md:items-end text-xs md:text-sm opacity-60 pl-4 md:pl-0 md:text-right">
              <div>Created: {originalMeta.createdAt ? new Date(originalMeta.createdAt).toLocaleString() : "—"}</div>
              <div>Updated: {originalMeta.updatedAt ? new Date(originalMeta.updatedAt).toLocaleString() : "—"}</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveClick} className="space-y-6 card p-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <label className="label"><span className="label-text">Surgery Name</span></label>
              <input className="input input-bordered w-full" value={surgeryName} onChange={(e) => setSurgeryName(e.target.value)} />
            </div>

            <div>
              <label className="label"><span className="label-text">Identifier (slug)</span></label>
              <input className="input input-bordered w-full" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="label"><span className="label-text">Description</span></label>
              <textarea className="textarea textarea-bordered w-full" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="label"><span className="label-text">Related Specialty</span></label>
              <input className="input input-bordered w-full" value={relatedSpecialty} onChange={(e) => setRelatedSpecialty(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="hidden md:flex items-center justify-between mb-3 w-full">
              <h3 className="text-lg font-medium">Topics & Items</h3>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-outline btn-sm gap-2" onClick={addTopic}>
                  <Plus size={14} /> Add Topic
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setTopics([]); toast("Cleared topics"); }}>
                  <Trash2 size={14} /> Clear All
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                  // quick refresh from store (in case someone else updated)
                  await getCareCheckLists();
                  const refreshed = (careCheckLists || []).find(c => String(c._id) === String(careCheckListId));
                  if (refreshed) populateForm(refreshed);
                  toast.success("Refreshed");
                }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="md:hidden mb-3 w-full">
              <h3 className="text-lg font-medium">Topics & Items</h3>
              <div className="flex items-center gap-1 mt-3 w-full">
                <button type="button" className="btn btn-outline btn-sm gap-1" onClick={addTopic}>
                  <Plus size={14} /> Add Topic
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setTopics([]); toast("Cleared topics"); }}>
                  <Trash2 size={14} /> Clear All
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
                  // quick refresh from store (in case someone else updated)
                  await getCareCheckLists();
                  const refreshed = (careCheckLists || []).find(c => String(c._id) === String(careCheckListId));
                  if (refreshed) populateForm(refreshed);
                  toast.success("Refreshed");
                }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {topics.map((tp) => (
                <div key={tp.id} className="border rounded p-4 bg-base-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="label"><span className="label-text">Topic name</span></label>
                      <input className="input input-bordered w-full" value={tp.topicName} onChange={(e) => updateTopicName(tp.id, e.target.value)} />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => removeTopic(tp.id)} title="Remove topic">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(tp.items || []).map((it) => (
                      <div key={it.id} className="flex gap-2 items-center">
                        <input className="input input-bordered w-full" value={it.text} onChange={(e) => updateItemText(tp.id, it.id, e.target.value)} />
                        <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => removeItem(tp.id, it.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <div>
                      <button type="button" className="btn btn-outline btn-sm gap-2" onClick={() => addItem(tp.id)}>
                        <Plus size={12} /> Add Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slightly different controls */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-0">

            {/* Checkbox: Full width on mobile, 50% on desktop */}
            <div className="w-full md:w-full">
              <label className="cursor-pointer label flex w-full items-start justify-start p-0">
                <input
                  type="checkbox"
                  className="checkbox mr-3 shrink-0"
                  checked={saveAsNewVersion}
                  onChange={(e) => setSaveAsNewVersion(e.target.checked)}
                />
                <span className="label-text flex-1 whitespace-normal text-left leading-tight">
                  Save as new version (auto-increment identifier)
                </span>
              </label>
            </div>

            {/* Buttons: Full width container on mobile to allow alignment */}
            <div className="grid grid-cols-2 md:flex items-center justify-end gap-3 w-full md:w-auto">
              <button type="button" className="btn btn-ghost" onClick={handleRevert}>
                <Download size={14} /> Revert
              </button>

              <button type="submit" className={`btn btn-primary ${isSubmitting ? "loading" : ""}`} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>

        {/* Live small preview */}
        <div className="mt-6 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Preview</h4>
            <div className="text-xs opacity-60">{identifier || "identifier will appear here"}</div>
          </div>

          <div>
            <div className="text-lg font-semibold">{surgeryName || "Untitled surgery"}</div>
            <div className="text-sm opacity-60">{relatedSpecialty || "General"}</div>
            <p className="mt-2 text-sm">{description || "No description"}</p>

            <div className="mt-4 space-y-3">
              {topics.map((tp) => (
                <div key={tp.id} className="p-3 border rounded">
                  <div className="font-medium">{tp.topicName || "Untitled topic"}</div>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    {tp.items.map((it) => (
                      <li key={it.id}>{it.text || "—"}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{saveAsNewVersion ? "Confirm Save as New Version" : "Confirm Update"}</h3>
                <p className="text-xs opacity-60 mt-1">Please confirm the changes before saving.</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[50vh] overflow-auto">
              <div className="text-md font-semibold">{surgeryName}</div>
              <div className="text-xs opacity-60">{saveAsNewVersion ? nextVersionIdentifier(identifier) : identifier}</div>
              <div className="text-sm opacity-60">{relatedSpecialty || "General"}</div>
              <p className="mt-2 text-sm">{description || "No description"}</p>

              <div className="mt-4 space-y-3">
                {topics.map((tp, idx) => (
                  <div key={tp.id} className="p-3 border rounded bg-base-100">
                    <div className="font-medium">{idx + 1}. {tp.topicName || "Untitled topic"}</div>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      {tp.items.map((it, ii) => (
                        <li key={it.id}>{it.text || "—"}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setConfirmOpen(false)}>Edit</button>
              <button className={`btn btn-primary gap-2 ${isSubmitting ? "loading" : ""}`} onClick={handleConfirmUpdate} disabled={isSubmitting}>
                <Check size={16} /> {isSubmitting ? "Saving..." : (saveAsNewVersion ? "Save as new version" : "Confirm & Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
