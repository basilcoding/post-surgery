// PatientJournalViewPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useSummaryStore } from "../../store/useSummaryStore";
import ChatbotIcon from "../../components/ChatbotComponents/ChatbotIcon.jsx";

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
      <div className={`badge ${map[status] || "badge-neutral"} badge-sm md:badge-md`}>
        {status === "UnderReview" ? "Under review" : status}
      </div>
    );
  };

  const JournalCard = ({ s, idx }) => {
    const created = s?.createdAt ? format(new Date(s.createdAt), "PPp") : "—";
    // const updated = s?.updatedAt ? format(new Date(s.updatedAt), "PPp") : null;
    const doctor = s?.assignedDoctor?.fullName || s?.assignedDoctor?.email;

    return (
      // Added card-compact for mobile, normal for md+
      <div className="card card-compact md:card-normal bg-base-100 shadow-sm border rounded-xl">
        <div className="card-body gap-2 md:gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-title text-sm md:text-base">Journal entry</h3>
            <div className="flex gap-2">
              <StatusBadge status={s?.status} />
              {s?.type === "emergency" && <div className="badge badge-error badge-sm md:badge-md">Concerning</div>}
            </div>
          </div>

          {/* <div className="text-sm text-base-content/70">
            {(s.content.length > 1 ? `Updated: ${s.formattedTimestamps[idx]} \n` : `Created: ${s.formattedTimestamps[idx]} \n`)}{Array.isArray(s.content) ? s.content.join(" — ") : String(s.content || "")}
          </div> */}

          {doctor && (
            <div className="text-xs md:text-sm">
              Assigned doctor: <span className="font-medium">{doctor}</span>
            </div>
          )}

          {Array.isArray(s?.content) && s.content.length > 0 ? (
            // <p className="text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
            //   {s.content.join("\n\n")}
            // </p>
            <p className="text-xs md:text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">{(s.content.length > 1 ? `Updated: ${s.formattedTimestamps[idx]}\n` : `Created: ${s.formattedTimestamps[idx]}\n`)}{Array.isArray(s.content) ? s.content.join("\n") : String(s.content || "")}</p>
          ) : (
            <p className="text-xs md:text-sm italic opacity-70">No notes in this entry.</p>
          )}

          <div className="flex items-center gap-3 text-xs md:text-sm opacity-80 mt-1">
            <span>{(s?.questionsAsked?.length || 0)} question(s)</span>
            <span>{s?.revision > 1 ? `Revisions: ${s?.revision - 1}` : ""}</span>
          </div>

          <div className="card-actions justify-end mt-2">
            <button className="btn btn-ghost btn-sm text-xs md:text-sm" onClick={() => setPreview(s)}>
              Quick view
            </button>
            <button
              className="btn btn-primary btn-sm text-xs md:text-sm"
              onClick={() => navigate(`/patient/view-journals/${s._id}`)}
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
      {list.map((s, idx) => (
        <JournalCard key={s._id} s={s} idx={idx} />
      ))}
    </div>
  );

  return (
    // Responsive padding: px-4 on mobile, px-10 on desktop
    <div className="w-full h-full px-4 md:px-10 pt-[70px] md:pt-[80px] pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">My Journals</h1>
          <p className="text-xs md:text-sm opacity-80">Review your journal entries and see their review status.</p>
        </div>

        <div className="flex items-center gap-2 justify-between md:justify-end">
          <button
            className={`btn btn-outline btn-sm ${loading ? "btn-disabled" : ""}`}
            onClick={loadData}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : "Refresh"}
          </button>

          {/* DaisyUI dropdown for type filter */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-sm m-1">
              Filter: {typeFilter}
              <svg className="ml-2 w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 z-[1]"
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
        <div className="alert alert-error mb-4 text-sm md:text-base">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          {/* Tabs - Added overflow-x-auto for mobile scrolling if needed */}
          <div role="tablist" className="tabs tabs-boxed w-full overflow-x-auto flex-nowrap">
            <a
              role="tab"
              className={`tab whitespace-nowrap flex-1 ${activeTab === "New" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("New")}
            >
              New ({filteredNew.length})
            </a>
            <a
              role="tab"
              className={`tab whitespace-nowrap flex-1 ${activeTab === "UnderReview" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("UnderReview")}
            >
              Under review ({filteredUnder.length})
            </a>
            <a
              role="tab"
              className={`tab whitespace-nowrap flex-1 ${activeTab === "Resolved" ? "tab-active" : ""}`}
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
                <div className="p-8 border rounded-xl text-center opacity-70 text-sm md:text-base">No new journals.</div>
              )
            )}

            {activeTab === "UnderReview" && (
              filteredUnder.length ? (
                <Column list={filteredUnder} />
              ) : (
                <div className="p-8 border rounded-xl text-center opacity-70 text-sm md:text-base">Nothing under review yet.</div>
              )
            )}

            {activeTab === "Resolved" && (
              filteredResolved.length ? (
                <Column list={filteredResolved} />
              ) : (
                <div className="p-8 border rounded-xl text-center opacity-70 text-sm md:text-base">No resolved journals yet.</div>
              )
            )}
          </div>
        </>
      )}

      {/* --- MODAL SECTION --- */}
      {preview && (
        // 1. Added z-[9999] to ensure it is above Chatbot
        // 2. Removed 'modal-bottom' and 'sm:modal-middle'. Default is centered which is safer.
        // 3. Added 'items-center' to force centering
        <div className="modal modal-open items-center justify-center z-[9999]">
          
          {/* 1. Added max-h-[85vh] to prevent it from going off-screen on mobile */}
          {/* 2. Added overflow-y-auto to the BOX itself so the whole card scrolls if needed */}
          <div className="modal-box w-11/12 max-w-3xl max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-2">Journal details</h3>

            <div className="space-y-2 text-xs md:text-sm opacity-80">
              <div>Created: {preview?.createdAt ? format(new Date(preview.createdAt), "PPp") : "—"}</div>
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
                <div className="font-medium mt-2 mb-1 text-sm md:text-base">Summary</div>
                {preview?.content?.length ? (
                  <div className="h-50 overflow-y-auto p-3 border rounded text-xs md:text-sm whitespace-pre-wrap bg-base-300">
                    {preview.content.map((c, idx) => {
                      return (
                        <span key={idx}>{(idx < (preview.formattedTimestamps.length - 1) ? `Updated: ${preview.formattedTimestamps[idx]} \n` : `Created: ${preview.formattedTimestamps[idx]} \n`)}{String(c) ? String(c + '\n\n') : String(c + '\n\n' || "")}</span>
                      )
                    })}
                  </div>
                ) : (<div className="italic text-muted-foreground text-sm">No notes</div>)}
              </div>

              <div>
                <div className="font-medium mb-2 text-sm md:text-base">Questions asked</div>
                {Array.isArray(preview?.questionsAsked) && preview.questionsAsked.length > 0 ? (
                  <ul className="h-35 overflow-y-auto list-disc pl-6 text-xs md:text-sm space-y-1">
                    {preview.questionsAsked.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs md:text-sm italic opacity-70">No questions recorded</div>
                )}
              </div>
            </div>

            <div className="modal-action bg-base-100 pt-2">
              <button className="btn btn-sm md:btn-md" onClick={() => setPreview(null)}>Close</button>
              <button
                className="btn btn-primary btn-sm md:btn-md"
                onClick={() => {
                  const id = preview._id;
                  setPreview(null);
                  navigate(`/patient/view-journals/${id}`);
                }}
              >
                Open
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPreview(null)} />
        </div>
      )}
      {/* --- END MODAL SECTION --- */}
      <ChatbotIcon />
    </div>
  );
}