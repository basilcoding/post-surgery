import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";
import { useDoctorStore } from "../../store/useDoctorStore";

import SidebarOption from "../../components/CommonComponents/SidebarOption.jsx";
import SummariesContainer from '../../components/DoctorComponents/SummariesContainer.jsx'

export default function EmergencySummaryPage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { newSummaries, recentlyViewedSummaries, summariesHistory, fetchSummaries } = useSummaryStore();
  const { markViewed } = useDoctorStore();
  const [viewType, setViewType] = useState('new');
  // const [summaryId, setSummaryId] = useState('');
  const [clickedSummary, setClickedSummary] = useState({ summaryId: '', viewedStatus: false });


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
        await markViewed(clickedSummary.summaryId, clickedSummary.viewedStatus);
        await fetchSummaries('emergency'); // re-fetch to refresh lists (or your markViewed could update store and you could skip)
      } catch (err) {
        console.error(err);
        setClickedSummary({ summaryId: '', viewedStatus: false });
        toast.error("Failed to mark summary read");
      } finally {
        if (!cancelled) setClickedSummary({ summaryId: '', viewedStatus: false });
      }
    }
    handleSummaryIdClick();

    return () => { cancelled = true; }
  }, [clickedSummary, markViewed]);

  // pass a function down that sets both id + doctor id
  const handleMarkViewedProp = (summaryId, viewedStatus) => {
    setClickedSummary({ summaryId: summaryId, viewedStatus: viewedStatus });
  };

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto md:min-h-screen">

        <div className="card bg-base-200 shadow-md h-full w-full">
          <div className="card-body">

            <SidebarOption
              label='New Emergency Journals'
              value='new'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label='Recently Viewed Emergency Journals'
              value='recentlyViewed'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label='Past Emergency Journals'
              value='history'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

          </div>
        </div>

        {viewType === 'new' && (
          <SummariesContainer
            summaries={newSummaries}
            activeView="new"
            onMarkViewed={handleMarkViewedProp}
          />
        )}

        {viewType === 'recentlyViewed' && (
          <SummariesContainer
            summaries={recentlyViewedSummaries}
            activeView="recentlyViewed"
            onMarkViewed={handleMarkViewedProp}
          />
        )}

        {viewType === 'history' && (
          <SummariesContainer
            summaries={summariesHistory}
            activeView="history"
            onMarkViewed={handleMarkViewedProp}
          />
        )}

      </div>
    </div >
  );
}

