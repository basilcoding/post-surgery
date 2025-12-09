// DoctorViewSummaryPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, ArrowLeft, Image as ImageIcon, ExternalLink } from "lucide-react";

// IMPORTANT: adjust import to your zustand store file
import { useSummaryStore } from "../../store/useSummaryStore.js";

export default function DoctorViewSummaryPage() {
  const { summaryId } = useParams();
  const navigate = useNavigate();

  // store - only read + fetch
  const { selectedSummary, getSummaryById } = useSummaryStore();

  const [loading, setLoading] = useState(false);

  // image viewer modal state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!summaryId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await getSummaryById(summaryId);
      } catch (err) {
        console.error("Failed to load summary:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryId]);

  const images = useMemo(() => selectedSummary?.surgerySiteImages || [], [selectedSummary]);

  function openGalleryAt(index) {
    setGalleryIndex(index);
    setGalleryOpen(true);
  }

  function nextImage() {
    setGalleryIndex((i) => (i + 1) % images.length);
  }
  function prevImage() {
    setGalleryIndex((i) => (i - 1 + images.length) % images.length);
  }

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
        <p>No summary found.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-6xl mx-auto p-6 pt-[80px]">
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex md:flex-row items-start justify-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} title="Back">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            {/* <h1 className="text-2xl font-semibold">Summary (Doctor view)</h1> */}
            <div className="text-sm text-gray-500 mt-1 flex gap-1">
              <span>Created At:</span>
              {selectedSummary?.formattedTimestamps?.[0] ??
                (selectedSummary?.createdAt ? new Date(selectedSummary.createdAt).toLocaleString() : "")}
            </div>
          </div>
        </div>

        <div className="text-left md:text-right text-sm text-gray-600">
          <div>Name: <span className="font-medium">{selectedSummary?.user?.fullName ?? "—"}</span></div>
          <div>PatientId: <span className="font-medium">{selectedSummary?.patient?.patientId ?? "—"}</span></div>
          <div>Assigned Doctor: <span className="font-medium">{selectedSummary?.assignedDoctorProfile?.doctorId ?? "—"}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left column: metadata (read-only) */}
        <div className="col-span-2 md:col-span-1 space-y-4 w-full">
          <div className="card bg-base-100 shadow w-full">
            <div className="card-body w-full">
              <h3 className="card-title">Summary details</h3>

              <label className="form-control">
                <span className="label-text">Status</span>
                <input className="input input-bordered" value={selectedSummary.status || ""} disabled readOnly />
              </label>

              <label className="form-control">
                <span className="label-text">Revision</span>
                <input className="input input-bordered" value={selectedSummary.revision ?? 0} disabled readOnly />
              </label>

              <label className="form-control">
                <span className="label-text">Resolved by</span>
                <input className="input input-bordered" value={selectedSummary.resolvedBy || ""} disabled readOnly />
              </label>

              <label className="form-control">
                <span className="label-text">Delivered to unassinged doctors</span>
                <input
                  className="input input-bordered"
                  value={
                    Array.isArray(selectedSummary?.deliveredTo) && selectedSummary.deliveredTo.length > 0
                      ? selectedSummary.deliveredTo.map((d, idx) => ((idx + 1 > 1) ? (((`${d.doctorProfile?.doctorId}`) || d.doctor)) : '')).join(" ")
                      : "-"
                  }
                  readOnly
                />
              </label>

              <div className="mt-2 text-xs text-gray-500">
                <div>Last updated: {selectedSummary.updatedAt ? new Date(selectedSummary.updatedAt).toLocaleString() : "—"}</div>
              </div>
            </div>
          </div>

          {/* Images summary card (large thumbnails) */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Surgery images</h4>
                <div className="text-sm text-gray-500">{images.length} image(s)</div>
              </div>

              {images.length === 0 ? (
                <div className="mt-4 text-sm text-gray-500">No images available.</div>
              ) : (
                <div className="mt-4 grid md:grid-cols-1 grid-cols-1 gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={img.cid || img.url || idx}
                      className="group block rounded overflow-hidden border hover:shadow-lg focus:shadow-lg"
                      onClick={() => openGalleryAt(idx)}
                      title="Open image"
                    >
                      {/* bigger thumb for doctor */}
                      <div className="relative w-full h-40 bg-black/5">
                        <img
                          src={img.url}
                          alt={`surgery-${idx}`}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = "/placeholder-image.png")}
                        />
                      </div>
                      <div className="p-2 text-xs text-left">
                        <div className="truncate">{img.caption || img.url?.split("/").pop() || `Image ${idx + 1}`}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right / main column: content & questions */}
        <div className="col-span-2 space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <h3 className="card-title">Content</h3>
                <div className="text-sm text-gray-500">Read-only</div>
              </div>

              <div className="mt-3 max-h-[60vh] overflow-auto space-y-4 pr-2">
                {/* content may be string or array */}
                {(() => {
                  const content = selectedSummary?.content;
                  if (!content) return <div className="text-sm text-gray-500">No content available.</div>;
                  if (Array.isArray(content)) {
                    return content.map((c, i) => (
                      <div key={i} className="p-4 bg-base-200 border rounded">
                        <div className="text-xs text-gray-500 mb-1">Entry {i + 1}</div>
                        <div className="whitespace-pre-wrap">{c}</div>
                      </div>
                    ));
                  }
                  return (
                    <div className="p-4 bg-base-200 border rounded">
                      <div className="whitespace-pre-wrap">{String(content)}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <h3 className="card-title">Questions asked</h3>
                <div className="text-sm text-gray-500">{Array.isArray(selectedSummary?.questionsAsked) ? selectedSummary.questionsAsked.length : 0}</div>
              </div>

              <div className="mt-3 max-h-[40vh] overflow-auto space-y-3 pr-2">
                {Array.isArray(selectedSummary?.questionsAsked) && selectedSummary.questionsAsked.length > 0 ? (
                  selectedSummary.questionsAsked.map((q, i) => (
                    <div key={i} className="p-3 border rounded bg-base-200">
                      <div className="text-xs text-gray-500 mb-1">Q{String(i + 1).padStart(2, "0")}</div>
                      <div>{q}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No questions recorded.</div>
                )}
              </div>
            </div>
          </div>

          {/* optionally extra area for notes or read-only actions */}
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost" onClick={() => window.open(`#`, "_blank")} title="Open in new tab (if applicable)">
              <ExternalLink size={16} /> Open
            </button>

            <div className="ml-auto text-sm text-gray-500">
              Created: {selectedSummary.createdAt ? new Date(selectedSummary.createdAt).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen image gallery modal (doctor-friendly large view) */}
      {galleryOpen && images[galleryIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-w-5xl w-full bg-base-100 rounded shadow-lg">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost btn-sm" onClick={() => setGalleryOpen(false)} aria-label="Close">
                  <X size={16} />
                </button>
                <div className="text-sm font-medium">{images[galleryIndex]?.caption || `Image ${galleryIndex + 1}`}</div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div>{galleryIndex + 1} / {images.length}</div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center">
              <div className="w-full max-h-[80vh] flex items-center justify-center">
                <img
                  src={images[galleryIndex].url}
                  alt={`full-${galleryIndex}`}
                  className="max-h-[80vh] max-w-full object-contain rounded"
                  onError={(e) => (e.target.src = "/placeholder-image.png")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border-t">
              <div className="flex items-center gap-2">
                <button className="btn btn-outline btn-sm" onClick={prevImage} disabled={images.length <= 1}>
                  Prev
                </button>
                <button className="btn btn-outline btn-sm" onClick={nextImage} disabled={images.length <= 1}>
                  Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a href={images[galleryIndex].url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Open original">
                  <ImageIcon size={16} /> Open original
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => setGalleryOpen(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
