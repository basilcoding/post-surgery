import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Search, Eye, Edit, Trash2, Plus, X, Check } from "lucide-react";
import toast from "react-hot-toast";

// adjust this import path to your project structure
import { useCareCheckListStore } from "../../store/useCareCheckListStore.js";

export default function ShowAllCareCheckListsPage() {
  const { getCareCheckLists, careCheckLists, deleteCareCheckListById } = useCareCheckListStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSurgery, setSelectedSurgery] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeList, setActiveList] = useState(null);

  // state for delete modal
  const [deleteTarget, setDeleteTarget] = useState(null); // object { _id, surgeryName, identifier }
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        await getCareCheckLists();
      } catch (err) {
        console.error("Failed to load care check lists:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [getCareCheckLists]);

  // gather all unique surgeryName values from returned lists
  const surgeryNames = useMemo(() => {
    const set = new Set();
    (careCheckLists || []).forEach((c) => {
      if (c.surgeryName) set.add(c.surgeryName);
      else if (c.displayName) set.add(c.displayName);
    });
    return ["all", ...Array.from(set)];
  }, [careCheckLists]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (careCheckLists || []).filter((c) => {
      const name = c.surgeryName || c.displayName || "";
      if (selectedSurgery !== "all" && name !== selectedSurgery) return false;
      if (!q) return true;
      return (
        name.toLowerCase().includes(q) ||
        (c.identifier || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [careCheckLists, query, selectedSurgery]);

  function openDetails(list) {
    setActiveList(list);
    setModalOpen(true);
  }

  function closeDetails() {
    setModalOpen(false);
    setActiveList(null);
  }

  // Open delete confirmation modal for a given list
  function openDeleteModal(list) {
    setDeleteTarget({
      _id: list._id,
      surgeryName: list.surgeryName || list.displayName || "Untitled",
      identifier: list.identifier || "",
    });
  }

  function closeDeleteModal() {
    if (isDeleting) return;
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget?._id) return;
    try {
      setIsDeleting(true);
      await deleteCareCheckListById(deleteTarget._id);
      // refresh lists after deletion
      await getCareCheckLists();
      // close details modal if that item was open
      if (activeList && activeList._id === deleteTarget._id) {
        closeDetails();
      }
      closeDeleteModal();
    } catch (err) {
      console.error("Failed to delete care checklist:", err);
      toast.error("Failed to delete checklist");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-6 pt-[90px] h-full w-full">
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Care Versioning</h1>

        <div className="flex items-stretch gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="flex items-center input-group w-full md:w-[420px]">
            <span className="flex items-center pl-3 pr-2">
              <Search size={18} />
            </span>
            <input
              className="input input-bordered w-full"
              placeholder="Search by surgery name, id or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* DaisyUI dropdown for surgery names */}
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-outline">
              {selectedSurgery === "all" ? "All Surgeries" : selectedSurgery}
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-72 max-h-60 overflow-auto">
              {surgeryNames.map((s) => (
                <li key={s}>
                  <a
                    className={s === selectedSurgery ? "font-semibold" : ""}
                    onClick={() => setSelectedSurgery(s)}
                  >
                    {s === "all" ? "All Surgeries" : s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <button
            className="btn btn-primary gap-2"
            onClick={() => navigate('/doctor/create-care-check-list')}
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg animate-pulse bg-base-100 h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-muted">No care checklists found.</p>
            </div>
          ) : (
            filtered.map((list) => {
              const name = list.surgeryName || list.displayName || "Untitled";
              return (
                <div key={list._id} className="card bg-base-100 shadow-lg rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-medium">{name}</h2>
                        <p className="text-xs opacity-60 mt-1">{list.identifier}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="badge badge-outline">{list.relatedSpecialty || "General"}</div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-600 line-clamp-3">{list.description || "—"}</p>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openDetails(list)}
                          title="View details"
                        >
                          <Eye size={16} /> View Details
                        </button>

                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => navigate(`/doctor/care-check-list/${list._id}`)}
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          className="btn btn-ghost btn-sm text-error"
                          title="Delete"
                          onClick={() => openDeleteModal(list)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete confirmation modal (small) */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box w-96 max-w-full">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Delete Checklist</h3>
                <p className="text-xs opacity-60 mt-1">This action cannot be undone.</p>
              </div>
              <button className="btn btn-ghost" onClick={closeDeleteModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <div className="font-medium">{deleteTarget.surgeryName}</div>
              <div className="text-xs opacity-60 mb-3">{deleteTarget.identifier}</div>
              <p className="text-sm">Are you sure you want to permanently delete this checklist?</p>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
              <button
                className={`btn btn-error gap-2 ${isDeleting ? "loading" : ""}`}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                <Check size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for details */}
      {modalOpen && activeList && (
        <div className="modal modal-open p-0 m-0">
          <div className="modal-box max-w-4xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{activeList.surgeryName || activeList.displayName}</h3>
                <p className="text-xs opacity-60">{activeList.identifier}</p>
                <div className="mt-2">
                  <span className="badge badge-outline">{activeList.relatedSpecialty || "General"}</span>
                </div>
              </div>

              <button className="btn btn-ghost" onClick={closeDetails} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-700">{activeList.description || "—"}</p>

              <div className="mt-6 space-y-4">
                {(activeList.topics || []).map((t, idx) => (
                  <div key={idx} className="border rounded p-4">
                    <div className="font-medium">{t.topicName}</div>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {(t.items || []).map((it, ii) => (
                        <li key={ii}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                {(!activeList.topics || activeList.topics.length === 0) && (
                  <div className="text-sm opacity-60">No topics available for this checklist.</div>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={closeDetails}>Close</button>
              <button onClick={() => navigate(`/doctor/care-check-list/${activeList._id}`)}
              className="btn btn-primary">View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
