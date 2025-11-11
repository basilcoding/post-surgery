import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Download, Edit } from "lucide-react";
import toast from "react-hot-toast";

// adjust path to your zustand store
import { useCareCheckListStore } from "../../store/useCareCheckListStore";

function slugify(text = "") {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes
}

export default function CreateCareCheckListPage() {
  const navigate = useNavigate();
  const { createCareCheckList } = useCareCheckListStore();

  const [surgeryName, setSurgeryName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [relatedSpecialty, setRelatedSpecialty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [topics, setTopics] = useState([
    { id: `t-${Date.now()}`, topicName: "", items: [{ id: `i-${Date.now()}`, text: "" }] },
  ]);

  // keep identifier in sync with surgeryName when user hasn't edited it manually
  const [identifierManuallyEdited, setIdentifierManuallyEdited] = useState(false);

  const onSurgeryNameChange = (val) => {
    setSurgeryName(val);
    if (!identifierManuallyEdited) {
      const slug = slugify(val);
      setIdentifier(slug ? `${slug}-v1` : "");
    }
  };

  const onIdentifierChange = (val) => {
    setIdentifier(val);
    setIdentifierManuallyEdited(true);
  };

  const addTopic = () => {
    setTopics((t) => [
      ...t,
      { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, topicName: "", items: [{ id: `i-${Date.now()}`, text: "" }] },
    ]);
  };

  const removeTopic = (topicId) => {
    setTopics((t) => t.filter((x) => x.id !== topicId));
  };

  const updateTopicName = (topicId, value) => {
    setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, topicName: value } : tp)));
  };

  const addItem = (topicId) => {
    setTopics((t) =>
      t.map((tp) =>
        tp.id === topicId
          ? { ...tp, items: [...tp.items, { id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: "" }] }
          : tp
      )
    );
  };

  const updateItemText = (topicId, itemId, value) => {
    setTopics((t) =>
      t.map((tp) =>
        tp.id === topicId ? { ...tp, items: tp.items.map((it) => (it.id === itemId ? { ...it, text: value } : it)) } : tp
      )
    );
  };

  const removeItem = (topicId, itemId) => {
    setTopics((t) =>
      t.map((tp) => (tp.id === topicId ? { ...tp, items: tp.items.filter((it) => it.id !== itemId) } : tp))
    );
  };

  const resetForm = () => {
    setSurgeryName("");
    setIdentifier("");
    setIdentifierManuallyEdited(false);
    setDescription("");
    setRelatedSpecialty("");
    setTopics([{ id: `t-${Date.now()}`, topicName: "", items: [{ id: `i-${Date.now()}`, text: "" }] }]);
  };

  const validate = () => {
    if (!surgeryName.trim()) {
      toast.error("Please enter surgery name");
      return false;
    }
    if (!identifier.trim()) {
      toast.error("Identifier is required");
      return false;
    }
    // at least one topic with one non-empty item
    if (topics.length === 0) {
      toast.error("Add at least one topic");
      return false;
    }
    for (const tp of topics) {
      if (!tp.topicName.trim()) {
        toast.error("All topics must have a name");
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

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      surgeryName: surgeryName.trim(),
      identifier: identifier.trim(),
      // relatedSpecialty: relatedSpecialty.trim() || undefined,
      description: description.trim() || undefined,
      topics: topics.map((tp) => ({ topicName: tp.topicName.trim(), items: tp.items.map((it) => it.text.trim()) })),
    };

    try {
      setIsSubmitting(true);
      await createCareCheckList(payload);
      // navigate back or reset form — choose reset here
      resetForm();
      navigate("/doctor/care-check-lists"); 
    } catch (err) {
      console.error("Failed to create care checklist:", err);
      toast.error("Failed to create care checklist");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pt-[90px] h-full w-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-semibold">Create Care Checklist</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 card p-6 shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="col-span-2">
              <label className="label">
                <span className="label-text">Surgery Name</span>
              </label>
              <input
                type="text"
                value={surgeryName}
                onChange={(e) => onSurgeryNameChange(e.target.value)}
                placeholder="e.g., Total Knee Replacement"
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Identifier (slug)</span>
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => onIdentifierChange(e.target.value)}
                placeholder="auto-generated: total-knee-replacement-v1"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="label"><span className="label-text">Description</span></label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this checklist (optional)"
                className="textarea textarea-bordered w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Topics & Items</h3>
              <button
                type="button"
                className="btn btn-outline btn-sm gap-2"
                onClick={addTopic}
                title="Add topic"
              >
                <Plus size={14} /> Add Topic
              </button>
            </div>

            <div className="space-y-4">
              {topics.map((tp, tIdx) => (
                <div key={tp.id} className="border rounded p-4 bg-base-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="label"><span className="label-text">Topic name</span></label>
                      <input
                        type="text"
                        value={tp.topicName}
                        onChange={(e) => updateTopicName(tp.id, e.target.value)}
                        placeholder="e.g., Pain Management"
                        className="input input-bordered w-full"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => removeTopic(tp.id)}
                        title="Remove topic"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(tp.items || []).map((it) => (
                      <div key={it.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={it.text}
                          onChange={(e) => updateItemText(tp.id, it.id, e.target.value)}
                          placeholder="Checklist item (e.g., Is pain controlled?)"
                          className="input input-bordered w-full"
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => removeItem(tp.id, it.id)}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm gap-2"
                        onClick={() => addItem(tp.id)}
                      >
                        <Plus size={12} /> Add Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-full w-full items-center justify-between">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  resetForm();
                  toast("Form cleared");
                }}
              >
                <Download size={14} /> Clear
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  // quick preview copy to clipboard
                  const preview = {
                    surgeryName,
                    identifier,
                    relatedSpecialty,
                    description,
                    topics: topics.map((tp) => ({ topicName: tp.topicName, items: tp.items.map((i) => i.text) })),
                  };
                  navigator.clipboard?.writeText(JSON.stringify(preview, null, 2));
                  toast.success("Preview copied to clipboard");
                }}
              >
                <Edit size={14} /> Copy Preview
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 ">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`btn btn-primary btn-sm md:btn-md ${isSubmitting ? "loading" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Checklist"}
              </button>
            </div>
          </div>
        </form>

        {/* Live preview */}
        <div className="mt-6 card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Live preview</h4>
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
    </div>
  );
}
