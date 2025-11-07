import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";

import SidebarOption from "../../components/CommonComponents/SidebarOption.jsx";
import SummariesContainer from '../../components/DoctorComponents/SummariesContainer.jsx'

export default function EmergencySummaryPage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { newSummaries, underReviewSummaries, resolvedSummaries, fetchSummaries, changeStatus } = useSummaryStore();
  const [viewType, setViewType] = useState('newSummaries');
  // const [summaryId, setSummaryId] = useState('');
  const [clickedSummary, setClickedSummary] = useState({ summaryId: '' , status: null});


  useEffect(() => {
    (async () => {
      await fetchSummaries('emergency');
    })();
  }, [fetchSummaries])

  useEffect(() => {
    if (!clickedSummary.summaryId) return;
    let cancelled = false;

    const handleSummaryIdClick = async () => {
      try {
        await changeStatus(clickedSummary.summaryId, clickedSummary.status);
        await fetchSummaries('emergency'); // re-fetch to refresh lists (or your changeStatus could update store and you could skip)
      } catch (err) {
        console.error(err);
        setClickedSummary({ summaryId: '', status: null });
        toast.error("Failed to mark summary read");
      } finally {
        if (!cancelled) setClickedSummary({ summaryId: '', status: null });
      }
    }
    handleSummaryIdClick();

    return () => { cancelled = true; }
  }, [clickedSummary, changeStatus, fetchSummaries]);

  useEffect(() => {
    const redirectError = localStorage.getItem("redirectError");
    if (redirectError) {
      toast.error(redirectError);
      localStorage.removeItem("redirectError");
    }
  }, []);

  // pass a function down that sets both id + doctor id
  const handlechangeStatusProp = (summaryId, status) => {
    setClickedSummary({ summaryId: summaryId, status: status });
  };

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <div className="md:min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        <div className="card bg-base-200 shadow-md h-full w-full">
          <div className="card-body">

            <SidebarOption
              label='New patient Journals'
              value='newSummaries'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label='Summaries Under Review'
              value='underReviewSummaries'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label='Resolved Summaries'
              value='resolvedSummaries'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

          </div>
        </div>

        {viewType === 'newSummaries' && (
          <SummariesContainer
            summaries={newSummaries}
            activeView="newSummaries"
            onChangeStatus={handlechangeStatusProp}
          />
        )}

        {viewType === 'underReviewSummaries' && (
          <SummariesContainer
            summaries={underReviewSummaries}
            activeView="underReviewSummaries"
            onChangeStatus={handlechangeStatusProp}
          />
        )}

        {viewType === 'resolvedSummaries' && (
          <SummariesContainer
            summaries={resolvedSummaries}
            activeView="resolvedSummaries"
            onChangeStatus={handlechangeStatusProp}
          />
        )}
      </div>
    </div >
  );
}
