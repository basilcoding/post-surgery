// DoctorJournalPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";

import CopyButtonComponent from "../../components/CommonComponents/CopyButtonComponent.jsx";

/**
 * DoctorJournalPage (simplified)
 * - Left: filters / counts / quick actions
 * - Right: scrollable list of summaries for selected bucket
 * - Removed: detail card, selection logic
 * - Added: DaisyUI dropdown filter for type (All | Journal | Emergency)
 * - Ensures newest summaries are shown at the top (sorted by createdAt desc)
 * - Quick-view modal includes "View patient" which opens an inner modal showing patient details
 */
export default function DoctorJournalPage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    newSummaries,
    underReviewSummaries,
    resolvedSummaries,
    fetchSummaries,
    changeStatus,
  } = useSummaryStore();

  const [viewType, setViewType] = useState("new"); // new | underReview | resolved
  const [typeFilter, setTypeFilter] = useState("All"); // All | journal | emergency
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null); // for marking status change in progress
  const [modalSummary, setModalSummary] = useState(null); // quick-view modal holds a summary object
  const [showPatientModal, setShowPatientModal] = useState(false); // nested patient modal

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await fetchSummaries(""); // keep server param flexible; client filters by typeFilter
      } catch (err) {
        console.error(err);
        setError("Failed to load summaries");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSummaries]);

  // derive counts (unfiltered)
  const counts = useMemo(
    () => ({
      new: (newSummaries || []).length,
      underReview: (underReviewSummaries || []).length,
      resolved: (resolvedSummaries || []).length,
    }),
    [newSummaries, underReviewSummaries, resolvedSummaries]
  );

  // choose current bucket
  const bucketList = useMemo(() => {
    if (viewType === "new") return newSummaries || [];
    if (viewType === "underReview") return underReviewSummaries || [];
    return resolvedSummaries || [];
  }, [viewType, newSummaries, underReviewSummaries, resolvedSummaries]);

  // apply type filter (All | journal | emergency) AND sort newest-first by createdAt
  const filteredList = useMemo(() => {
    if (!Array.isArray(bucketList)) return [];

    // make a shallow copy, filter by type if needed, then sort by createdAt desc
    const copy = (typeFilter === "All")
      ? bucketList.slice()
      : bucketList.filter((s) => (s?.type || "").toLowerCase() === typeFilter.toLowerCase());

    copy.sort((a, b) => {
      // fallback to 0 if missing dates
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta; // newest (larger timestamp) first
    });

    return copy;
  }, [bucketList, typeFilter]);

  const handleChangeStatus = async (summaryId, targetStatus) => {
    if (!summaryId) return;
    setBusyId(summaryId);
    try {
      await changeStatus(summaryId, targetStatus);
      await fetchSummaries("");
      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const openFull = (id) => navigate(`/journals/${id}`);

  // helper to safely reach patient object inside modalSummary
  const patient = modalSummary?.patient || null;

  return (
    <div className="min-h-screen pt-[80px] bg-base-100">
      <div className="max-w-7xl px-4 py-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Patient Summaries</h1>
            <p className="text-sm text-muted-foreground">Manage incoming summaries.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                fetchSummaries("").finally(() => setLoading(false));
              }}
              className="btn btn-outline btn-sm"
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Refresh"}
            </button>
          </div>
        </div>

        {/* grid: sidebar + list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="card bg-base-200 p-4 shadow-sm sticky top-[90px]">
              <h3 className="font-semibold mb-1">Views</h3>
              <p className="text-xs text-muted-foreground mb-3">Switch buckets</p>

              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setViewType("new")}
                  className={`flex items-center justify-between w-full btn btn-ghost ${viewType === "new" ? "bg-primary/10" : ""}`}
                >
                  <span>New Summaries</span>
                  <span className="text-sm text-muted-foreground badge badge-info">{counts.new}</span>
                </button>

                <button
                  onClick={() => setViewType("underReview")}
                  className={`flex items-center justify-between w-full btn btn-ghost ${viewType === "underReview" ? "bg-primary/10" : ""}`}
                >
                  <span>Under Review</span>
                  <span className="text-sm text-muted-foreground badge badge-warning">{counts.underReview}</span>
                </button>

                <button
                  onClick={() => setViewType("resolved")}
                  className={`flex items-center justify-between w-full btn btn-ghost ${viewType === "resolved" ? "bg-primary/10" : ""}`}
                >
                  <span>Resolved</span>
                  <span className="text-sm text-muted-foreground badge badge-success">{counts.resolved}</span>
                </button>
              </div>

              <div className="divider my-3" />

              {/* DaisyUI dropdown for type filter */}
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-2">Filter type</div>
                <div className="dropdown dropdown-start">
                  <label tabIndex={0} className="btn w-full justify-between">
                    {typeFilter}
                    <svg className="ml-2 w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </label>
                  <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44">
                    <li><a onClick={() => setTypeFilter("All")} className={typeFilter === "All" ? "font-medium" : ""}>All</a></li>
                    <li><a onClick={() => setTypeFilter("journal")} className={typeFilter === "journal" ? "font-medium" : ""}>Journal</a></li>
                    <li><a onClick={() => setTypeFilter("emergency")} className={typeFilter === "emergency" ? "font-medium text-error" : ""}>Emergency</a></li>
                  </ul>
                </div>
              </div>

              <div className="divider my-3" />

              <div>
                <h4 className="text-sm font-medium mb-2">Quick actions</h4>
                <div className="flex flex-col gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      if (!filteredList.length) return toast("No items in current view");
                      handleChangeStatus(filteredList[0]._1d, "UnderReview");
                    }}
                  >
                    Mark top as Under Review
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Summaries list (main) */}
          <main className="lg:col-span-9">
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-3">
                  {viewType === "new" && <h3 className="text-lg font-medium">New</h3>}
                  {viewType === "underReview" && <h3 className="text-lg font-medium">Under Review</h3>}
                  {viewType === "resolved" && <h3 className="text-lg font-medium">Resolved</h3>}
                  <div className="text-sm text-muted-foreground">{filteredList.length} item(s)</div>
                </div>

                {filteredList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No summaries in this view.</div>
                ) : (
                  <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-2">
                    {filteredList.map((s, idx) => {
                      const assigned = s?.assignedDoctor?.fullName || s?.assignedDoctor?.email || "Unassigned";
                      const patientId = s?.patient?.patientId;
                      return (
                        <article key={s._id} className="p-3 rounded-lg border border-base-200 bg-base-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center">
                                  <h4 className="font-semibold text-sm truncate pr-2">Patient: </h4>
                                  <CopyButtonComponent value={s?.patient?.patientId} />
                                </div>
                                <div className="flex items-center gap-2">
                                  {s.type === 'emergency' && <span className="badge badge-error">Concerning</span>}
                                  <span className="text-xs text-muted-foreground">{format(new Date(s.createdAt), "PPp")}</span>
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                                {(idx > 0 ? `Updated: ${s.formattedTimestamps[idx]} \n` : `Created: ${s.formattedTimestamps[idx]} \n`)}{Array.isArray(s.content) ? s.content.join(" — ") : String(s.content || "")}
                              </p>

                              <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className="text-xs">Assigned: Dr. <span className="font-medium">{assigned}</span></span>
                                <span className="text-xs">Questions: <span className="font-medium">{(s.questionsAsked?.length || 0)}</span></span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end gap-2">
                              <div className="dropdown dropdown-end">
                                <label tabIndex={0} className="btn btn-ghost btn-sm">Actions ▾</label>
                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44">
                                  {s.status === "New" && (
                                    <>
                                      <li onClick={() => handleChangeStatus(s._id, "UnderReview")} className={`${busyId === s._id ? "opacity-60 pointer-events-none" : "cursor-pointer p-2 hover:bg-black/5 rounded-xl"}`}>Mark as Under Review</li>
                                      <li onClick={() => handleChangeStatus(s._id, "Resolved")} className={`${busyId === s._id ? "opacity-60 pointer-events-none" : "cursor-pointer p-2 hover:bg-black/5 rounded-xl"}`}>Mark as Resolved</li>
                                    </>
                                  )}
                                  {s.status === "UnderReview" && (
                                    <li onClick={() => handleChangeStatus(s._id, "Resolved")} className={`${busyId === s._id ? "opacity-60 pointer-events-none" : "cursor-pointer p-2 hover:bg-black/5 rounded-xl"}`}>Mark as Resolved</li>
                                  )}
                                  {s.status === "Resolved" && (
                                    <li onClick={() => handleChangeStatus(s._id, "UnderReview")} className={`${busyId === s._id ? "opacity-60 pointer-events-none " : "cursor-pointer p-2 hover:bg-black/5 rounded-xl"}`}>Mark as Unresolved</li>
                                  )}
                                  <li onClick={() => openFull(s._id)} className="cursor-pointer p-2 hover:bg-black/5 rounded-xl">Open full</li>
                                </ul>
                              </div>
                              <button className="btn btn-ghost btn-sm" onClick={() => setModalSummary(s)}>
                                Quick view
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Quick view modal for a single summary */}
        {modalSummary && (
          <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-lg mb-2">Summary details</h3>

              <div className="space-y-3 text-sm">
                <div>PatientId: {modalSummary.patient?.patientId}</div>
                <div>FullName: {modalSummary.user?.fullName}</div>
                <div>Created: {modalSummary ? format(new Date(modalSummary.createdAt), "PPp") : "—"}</div>
                <div>Status: {modalSummary?.status}</div>

                <div>
                  <div className="font-medium mt-2 mb-1">Summary</div>
                  {modalSummary?.content?.length ? (
                    <div className="p-3 border rounded text-sm whitespace-pre-wrap max-h-48 overflow-auto bg-base-300">
                      {modalSummary.content.map((c, idx) => {
                        return (
                          <span>{(idx < (modalSummary.formattedTimestamps.length - 1) ? `Updated: ${modalSummary.formattedTimestamps[idx]} \n` : `Created: ${modalSummary.formattedTimestamps[idx]} \n`)}{String(c) ? String(c + '\n\n') : String(c + '\n\n' || "")}</span>
                        )
                      })}
                    </div>
                  ) : (<div className="italic text-muted-foreground">No notes</div>)}
                </div>

                <div>
                  <div className="font-medium">Questions asked</div>
                  {modalSummary?.questionsAsked?.length ? (
                    <ul className="list-disc pl-5 text-sm">
                      {modalSummary.questionsAsked.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  ) : (<div className="italic text-muted-foreground">No questions</div>)}
                </div>
              </div>

              <div className="modal-action">
                <button className="btn btn-base-300 mr-1" onClick={() => setModalSummary(null)}>Close</button>

                {/* NEW: open inner patient modal */}
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPatientModal(true)}
                >
                  View patient
                </button>

                {/* <button className="btn btn-primary" onClick={() => { openFull(modalSummary._id); setModalSummary(null); }}>Open</button> */}
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setModalSummary(null)} />

            {/* Nested patient modal (renders while quick-view modal open) */}
            {showPatientModal && patient && (
              <div className="modal modal-open">
                <div className="modal-box max-w-4xl w-full">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-xl">Patient Information</h3>
                    <div className="text-sm text-muted-foreground">ID: {patient.patientId || "N/A"}</div>
                  </div>

                  <div className="mt-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                    {/* Basic */}
                    <section>
                      <h4 className="font-medium mb-2">Basic</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><span className="text-xs text-muted-foreground">Full name</span><div className="font-medium">{modalSummary.user?.fullName || patient.user?.fullName || "—"}</div></div>
                        <div><span className="text-xs text-muted-foreground">Email</span><div className="font-medium">{modalSummary?.user?.email || "—"}</div></div>
                        <div><span className="text-xs text-muted-foreground">Patient ID</span><div className="font-medium">{patient.patientId || "—"}</div></div>
                      </div>
                    </section>

                    {/* Allergies */}
                    <section>
                      <h4 className="font-medium mb-2">Allergies</h4>
                      {patient.allergies?.length ? (
                        <ul className="list-disc pl-5">
                          {patient.allergies.map((a, i) => (
                            <li key={i}>
                              <div className="font-medium">{a.allergen}</div>
                              <div className="text-xs text-muted-foreground">Reaction: {a.reaction || "—"} • Severity: {a.severity || "—"}</div>
                              {a.notes && <div className="text-xs">{a.notes}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="italic text-muted-foreground">No allergies recorded.</div>
                      )}
                    </section>

                    {/* Chronic conditions */}
                    <section>
                      <h4 className="font-medium mb-2">Chronic Conditions</h4>
                      {patient.chronicConditions?.length ? (
                        <ul className="list-disc pl-5">
                          {patient.chronicConditions.map((c, i) => (
                            <li key={i}>
                              <div className="font-medium">{c.conditionName}</div>
                              <div className="text-xs text-muted-foreground">Diagnosed: {c.diagnosisDate ? format(new Date(c.diagnosisDate), "PP") : "—"}</div>
                              {c.notes && <div className="text-xs">{c.notes}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="italic text-muted-foreground">No chronic conditions recorded.</div>
                      )}
                    </section>

                    {/* Current medications */}
                    <section>
                      <h4 className="font-medium mb-2">Current Medications</h4>
                      {patient.currentMedications?.length ? (
                        <ul className="list-disc pl-5">
                          {patient.currentMedications.map((m, i) => (
                            <li key={i}>
                              <div className="font-medium">{m.medicationName} — {m.dosage}</div>
                              <div className="text-xs text-muted-foreground">{m.frequency} • Reason: {m.reason}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="italic text-muted-foreground">No current medications recorded.</div>
                      )}
                    </section>

                    {/* Family history */}
                    <section>
                      <h4 className="font-medium mb-2">Family History</h4>
                      {patient.familyHistory?.length ? (
                        <ul className="list-disc pl-5">
                          {patient.familyHistory.map((f, i) => (
                            <li key={i}><div className="font-medium">{f.relation}: {f.condition}</div></li>
                          ))}
                        </ul>
                      ) : (
                        <div className="italic text-muted-foreground">No family history recorded.</div>
                      )}
                    </section>

                    {/* Past surgeries */}
                    <section>
                      <h4 className="font-medium mb-2">Past Surgeries</h4>
                      {patient.pastSurgeries?.length ? (
                        <ul className="list-disc pl-5">
                          {patient.pastSurgeries.map((surg, i) => (
                            <li key={i}>
                              <div className="font-medium">{surg.procedureName}</div>
                              <div className="text-xs text-muted-foreground">Date: {surg.procedureDate ? format(new Date(surg.procedureDate), "PP") : "—"}</div>
                              {surg.notes && <div className="text-xs">{surg.notes}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="italic text-muted-foreground">No past surgeries recorded.</div>
                      )}
                    </section>

                    {/* fallback raw JSON for unexpected fields */}
                    <section>
                      <h4 className="font-medium mb-2">Raw (debug)</h4>
                      <pre className="text-xs overflow-auto max-h-40 p-2 bg-base-100 rounded">{JSON.stringify(patient, null, 2)}</pre>
                    </section>
                  </div>

                  <div className="modal-action">
                    <button className="btn" onClick={() => setShowPatientModal(false)}>Close</button>
                    {/* <button className="btn btn-primary" onClick={() => { setShowPatientModal(false); setModalSummary(null); openFull(modalSummary._id); }}>Open summary</button> */}
                  </div>
                </div>
                <div className="modal-backdrop" onClick={() => setShowPatientModal(false)} />
              </div>
            )}
          </div>
        )}

        {/* Error strip */}
        {error && (
          <div className="mt-4">
            <div className="alert alert-error">
              <div>
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
