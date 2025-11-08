// PatientJournalViewPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useSummaryStore } from "../../store/useSummaryStore";

/**
 * PatientJournalViewPage using Zustand store values
 * - No direct axios calls here
 * - Uses newSummaries / underReviewSummaries / resolvedSummaries from store
 * - Calls fetchSummaries('journal') on mount & refresh
 * - Ensures newest-first ordering (createdAt desc) for all filtered lists
 */
export default function PatientJournalViewPage() {
  const navigate = useNavigate();

  const {
    newSummaries,
    underReviewSummaries,
    resolvedSummaries,
    fetchSummaries,
  } = useSummaryStore();

  const [activeTab, setActiveTab] = useState("New");
  const [typeFilter, setTypeFilter] = useState("All"); // All | journal | emergency
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      await fetchSummaries(""); // server-side filtering optional
    } catch (err) {
      console.error(err);
      setError("Failed to load journals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeMatches = (s) => {
    if (!s) return false;
    if (typeFilter === "All") return true;
    return (s.type || "").toLowerCase() === typeFilter.toLowerCase();
  };

  /**
   * Filters a list by typeFilter and returns a new array sorted newest-first by createdAt.
   * Defensive: treats missing createdAt as 0 timestamp so they end up last.
   */
  const filterList = (list) => {
    if (!Array.isArray(list)) return [];
    const filtered = list.filter((s) => typeMatches(s));
    // shallow copy then sort newest-first
    const copy = filtered.slice();
    copy.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta; // newest (larger timestamp) first
    });
    return copy;
  };

  const filteredNew = useMemo(() => filterList(newSummaries), [newSummaries, typeFilter]);
  const filteredUnder = useMemo(() => filterList(underReviewSummaries), [underReviewSummaries, typeFilter]);
  const filteredResolved = useMemo(() => filterList(resolvedSummaries), [resolvedSummaries, typeFilter]);

  const StatusBadge = ({ status }) => {
    const map = { New: "badge-info", UnderReview: "badge-warning", Resolved: "badge-success" };
    return (
      <div className={`badge ${map[status] || "badge-neutral"}`}>
        {status === "UnderReview" ? "Under review" : status}
      </div>
    );
  };

  const JournalCard = ({ s }) => {
    const created = s?.createdAt ? format(new Date(s.createdAt), "PPp") : "—";
    const updated = s?.updatedAt ? format(new Date(s.updatedAt), "PPp") : null;
    const doctor = s?.assignedDoctor?.fullName || s?.assignedDoctor?.email;

    return (
      <div className="card bg-base-100 shadow-sm border rounded-xl">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <h3 className="card-title text-base">Journal entry</h3>
            <div className="flex gap-2">
              <StatusBadge status={s?.status} />
              {s?.type === "emergency" && <div className="badge badge-error">Concerning</div>}
            </div>
          </div>

          <div className="text-sm text-base-content/70">
            <span>Created: {created}</span>
            {updated && <span className="ml-2">• Updated: {updated}</span>}
          </div>

          {doctor && (
            <div className="text-sm">
              Assigned doctor: <span className="font-medium">{doctor}</span>
            </div>
          )}

          {Array.isArray(s?.content) && s.content.length > 0 ? (
            <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
              {s.content.join("\n\n")}
            </p>
          ) : (
            <p className="text-sm italic opacity-70">No notes in this entry.</p>
          )}

          <div className="flex items-center gap-3 text-sm opacity-80">
            <span>{(s?.questionsAsked?.length || 0)} question(s)</span>
            <span>{s?.revision > 1 ? `Revisions: ${s?.revision - 1}` : ""}</span>
          </div>

          <div className="card-actions justify-end">
            <button className="btn btn-ghost btn-sm" onClick={() => setPreview(s)}>
              Quick view
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/journals/${s._id}`)}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Column = ({ list }) => (
    <div className="grid gap-3">
      {list.map((s) => (
        <JournalCard key={s._id} s={s} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pt-[80px] px-10 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">My Journals</h1>
          <p className="text-sm opacity-80">Review your journal entries and see their review status.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`btn btn-outline btn-sm ${loading ? "btn-disabled" : ""}`}
            onClick={loadData}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Refresh"}
          </button>

          {/* DaisyUI dropdown for type filter */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn m-1">
              Filter: {typeFilter}
              <svg className="ml-2 w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48"
            >
              <li>
                <a
                  onClick={() => setTypeFilter("All")}
                  className={typeFilter === "All" ? "font-medium" : ""}
                >
                  All
                </a>
              </li>
              <li>
                <a
                  onClick={() => setTypeFilter("journal")}
                  className={typeFilter === "journal" ? "font-medium" : ""}
                >
                  Journal
                </a>
              </li>
              <li>
                <a
                  onClick={() => setTypeFilter("emergency")}
                  className={typeFilter === "emergency" ? "font-medium text-error" : ""}
                >
                  Emergency
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div role="tablist" className="tabs tabs-boxed">
            <a
              role="tab"
              className={`tab ${activeTab === "New" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("New")}
            >
              New ({filteredNew.length})
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === "UnderReview" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("UnderReview")}
            >
              Under review ({filteredUnder.length})
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === "Resolved" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("Resolved")}
            >
              Resolved ({filteredResolved.length})
            </a>
          </div>

          <div className="mt-4">
            {activeTab === "New" && (
              filteredNew.length ? (
                <Column list={filteredNew} />
              ) : (
                <div className="p-8 border rounded-xl text-center opacity-70">No new journals.</div>
              )
            )}

            {activeTab === "UnderReview" && (
              filteredUnder.length ? (
                <Column list={filteredUnder} />
              ) : (
                <div className="p-8 border rounded-xl text-center opacity-70">Nothing under review yet.</div>
              )
            )}

            {activeTab === "Resolved" && (
              filteredResolved.length ? (
                <Column list={filteredResolved} />
              ) : (
                <div className="p-8 border rounded-xl text-center opacity-70">No resolved journals yet.</div>
              )
            )}
          </div>
        </>
      )}

      {/* Quick View Modal */}
      {preview && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-2">Journal details</h3>

            <div className="space-y-2 text-sm opacity-80">
              <div>Created: {preview?.createdAt ? format(new Date(preview.createdAt), "PPp") : "—"}</div>
              {preview?.updatedAt && <div>Updated: {format(new Date(preview.updatedAt), "PPp")}</div>}
              {preview?.assignedDoctor && (
                <div>
                  Assigned doctor:{" "}
                  {preview?.assignedDoctor?.name ||
                    preview?.assignedDoctor?.fullName ||
                    preview?.assignedDoctor?.email}
                </div>
              )}
              <div>Status: {preview?.status}</div>
              {preview?.resolvedAt && <div>Resolved at: {format(new Date(preview.resolvedAt), "PPp")}</div>}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="font-medium mb-2">Bot notes</div>
                {Array.isArray(preview?.content) && preview.content.length > 0 ? (
                  <div className="rounded-xl border p-3 text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                    {preview.content.join("\n\n")}
                  </div>
                ) : (
                  <div className="text-sm italic opacity-70">No notes</div>
                )}
              </div>

              <div>
                <div className="font-medium mb-2">Questions asked</div>
                {Array.isArray(preview?.questionsAsked) && preview.questionsAsked.length > 0 ? (
                  <ul className="list-disc pl-6 text-sm space-y-1 max-h-48 overflow-auto">
                    {preview.questionsAsked.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm italic opacity-70">No questions recorded</div>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setPreview(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const id = preview._id;
                  setPreview(null);
                  navigate(`/journals/${id}`);
                }}
              >
                Open
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPreview(null)} />
        </div>
      )}
    </div>
  );
}
