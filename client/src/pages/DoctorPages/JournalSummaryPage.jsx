import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useSummaryStore } from "../../store/useSummaryStore";

import SidebarOption from "../../components/CommonComponents/SidebarOption.jsx";
import SummariesContainer from '../../components/DoctorComponents/SummariesContainer.jsx'

export default function JournalSummaryPage() {
  const navigate = useNavigate();
  const { authUser, newSummary } = useAuthStore();
  const { newSummaries, recentlyViewedSummaries, summariesHistory, fetchSummaries, markViewed } = useSummaryStore();
  const [viewType, setViewType] = useState('new');
  // const [summaryId, setSummaryId] = useState('');
  const [clickedSummary, setClickedSummary] = useState({ summaryId: '' , viewedStatus: false});


  useEffect(() => {
    (async () => {
      await fetchSummaries('journal');
    })();
  }, [fetchSummaries])

  useEffect(() => {
    if (!clickedSummary.summaryId) return;
    let cancelled = false;

    const handleSummaryIdClick = async () => {
      try {
        await markViewed(clickedSummary.summaryId, clickedSummary.viewedStatus);
        await fetchSummaries('journal'); // re-fetch to refresh lists (or your markViewed could update store and you could skip)
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
  }, [clickedSummary, markViewed, fetchSummaries]);

  useEffect(() => {
    const redirectError = localStorage.getItem("redirectError");
    if (redirectError) {
      toast.error(redirectError);
      localStorage.removeItem("redirectError");
    }
  }, []);

  // pass a function down that sets both id + doctor id
  const handleMarkViewedProp = (summaryId, viewedStatus) => {
    setClickedSummary({ summaryId: summaryId, viewedStatus: viewedStatus });
  };

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <div className="md:min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

        <div className="card bg-base-200 shadow-md h-full w-full">
          <div className="card-body">

            <SidebarOption
              label='New patient Journals'
              value='new'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label='Recently Viewed Journals'
              value='recentlyViewed'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label='Past Journals'
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






// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";

// import { useAuthStore } from "../../store/useAuthStore";
// import { useSummaryStore } from "../../store/useSummaryStore";

// export default function DoctorHomePage() {
//   const navigate = useNavigate();
//   const { journalSummaries } = useAuthStore();
//   const { newSummaries, viewedSummaries, summariesHistory, fetchSummaries, markViewed } = useSummaryStore();
//   const [activeView, setActiveView] = useState('new');
//   const [summaryId, setSummaryId] = useState('');

//   useEffect(() => {
//     const handleSummaryIdClick = async () => {
//       if (summaryId) {
//         await markViewed(summaryId);
//       }
//     }
//     handleSummaryIdClick();
//     fetchSummaries('journal');
//   }, [journalSummaries, summaryId]);

//   useEffect(() => {
//     const redirectError = localStorage.getItem("redirectError");
//     if (redirectError) {
//       toast.error(redirectError);
//       localStorage.removeItem("redirectError");
//     }
//   }, []);



//   return (
//     <div className="p-6 h-screen overflow-y-auto">
//       <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

//         <div className="card bg-base-200 shadow-md h-full">
//           <div className="card-body">

//             <h2 className={`
//             card-title p-2 hover:cursor-pointer bg-base-300 rounded
//             ${activeView === 'new' ? 'active' : ''}`}
//               onClick={() => setActiveView('new')}
//             >
//               New patient Journals
//             </h2>

//             <h2 className={`
//             card-title p-2 hover:cursor-pointer bg-base-300 rounded
//             ${activeView === 'viewed' ? 'active' : ''}`}
//               onClick={() => setActiveView('viewed')}
//             >
//               Recently Viewed Journals
//             </h2>

//             <h2 className={`
//             card-title p-2 hover:cursor-pointer bg-base-300 rounded
//             ${activeView === 'history' ? 'active' : ''}`}
//               onClick={() => setActiveView('history')}
//             >
//               Past Journals
//             </h2>

//           </div>
//         </div>

//         {activeView === 'new' &&
//           <div className="card bg-base-200 shadow-md col-span-2 overflow-y-auto">
//             <div className="card-body">
//               <h2 className="card-title">
//                 New Patient Journals
//               </h2>
//               <div className="space-y-3 mt-2 max-h-[60vh]">
//                 {newSummaries.length === 0 ? (
//                   <p className="text-gray-500">No New journals yet.</p>
//                 ) : (
//                   newSummaries.map((summary) => (
//                     <div key={summary._id} className="card bg-base-300 shadow-sm">
//                       <div className="card-body py-3 px-4">
//                         <div className="flex items-center justify-between">

//                           <h3 className="font-semibold text-sm">Patient: {summary.patient.fullName}</h3>
//                           <span className="text-sm text-accent">
//                             <div className='btn mx-1' onClick={() => setSummaryId(summary._id)}>
//                               {summary.viewed === true ? 'Viewed' : 'Mark as Read'}
//                               {console.log(summaryId)}
//                             </div>

//                             {/* Open the modal using document.getElementById('ID').showModal() method */}
//                             <button className="btn" onClick={() => document.getElementById(`my_modal_2${summary._id}`).showModal()}>Info</button>
//                             <dialog id={`my_modal_2${summary._id}`} className="modal">
//                               <div className="modal-box">
//                                 <h3 className="font-bold text-lg">Hello!</h3>
//                                 <p className="py-4">Press ESC key or click outside to close</p>
//                               </div>
//                               <form method="dialog" className="modal-backdrop">
//                                 <button>close</button>
//                               </form>
//                             </dialog>
//                           </span>

//                         </div>
//                         <p className="text-sm text-gray-700 mt-2 flex justify-between">
//                           Notes:
//                         </p>
//                         <ul className="list-disc pl-5 text-sm mt-1">
//                           {summary.content.map((note, i) => (
//                             <li key={i}>{note}</li>
//                           ))}
//                         </ul>

//                         {summary.questionsAsked?.length > 0 && (
//                           <>
//                             <p className="text-sm text-gray-700 mt-2">Follow-up Questions:</p>
//                             <ul className="list-disc pl-5 text-sm mt-1">
//                               {summary.questionsAsked.map((q, i) => (
//                                 <li key={i}>{q}</li>
//                               ))}
//                             </ul>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>}

//         {activeView === 'viewed' &&
//           < div className="card bg-base-200 shadow-md col-span-2">
//             <div className="card-body">
//               <h2 className="card-title">Viewed Journals</h2>
//               <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
//                 {viewedSummaries.length === 0 ? (
//                   <p className="text-gray-500">No Viewed journal yet.</p>
//                 ) : (
//                   viewedSummaries.map((summary, idx) => (
//                     <div key={idx} className="card bg-base-200 shadow-sm">
//                       <div className="card-body py-3 px-4">
//                         <div className="flex items-center justify-between">
//                           <h3 className="font-semibold text-sm">Patient</h3>
//                           <span className="text-sm text-blue-600">{summary.patientEmail}</span>
//                         </div>

//                         <p className="text-sm text-gray-700 mt-2">Notes:</p>
//                         <ul className="list-disc pl-5 text-sm mt-1">
//                           {summary.content.map((note, i) => (
//                             <li key={i}>{note}</li>
//                           ))}
//                         </ul>

//                         {summary.questionsAsked?.length > 0 && (
//                           <>
//                             <p className="text-sm text-gray-700 mt-2">Follow-up Questions:</p>
//                             <ul className="list-disc pl-5 text-sm mt-1">
//                               {summary.questionsAsked.map((q, i) => (
//                                 <li key={i}>{q}</li>
//                               ))}
//                             </ul>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>}

//         {activeView === 'history' &&
//           <div className="card bg-base-200 shadow-md col-span-2">
//             <div className="card-body">
//               <h2 className="card-title">
//                 Past Journals
//                 <div className="dropdown dropdown-left">
//                   <div tabIndex={0} role="button" className="btn m-1">Click</div>
//                   <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
//                     <li><a>Item 1</a></li>
//                     <li><a>Item 2</a></li>
//                   </ul>
//                 </div>
//               </h2>
//               <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
//                 {summariesHistory.length === 0 ? (
//                   <p className="text-gray-500">No History to be shown.</p>
//                 ) : (
//                   summariesHistory.map((summary, idx) => (
//                     <div key={idx} className="card bg-base-200 shadow-sm">
//                       <div className="card-body py-3 px-4">
//                         <div className="flex items-center justify-between">
//                           <h3 className="font-semibold text-sm">Patient</h3>
//                           <span className="text-sm text-accent">{summary.patient.email}</span>
//                         </div>

//                         <p className="text-sm text-gray-700 mt-2">Notes:</p>
//                         <ul className="list-disc pl-5 text-sm mt-1">
//                           {summary.content.map((note, i) => (
//                             <li key={i}>{note}</li>
//                           ))}
//                         </ul>

//                         {summary.questionsAsked?.length > 0 && (
//                           <>
//                             <p className="text-sm text-gray-700 mt-2">Follow-up Questions:</p>
//                             <ul className="list-disc pl-5 text-sm mt-1">
//                               {summary.questionsAsked.map((q, i) => (
//                                 <li key={i}>{q}</li>
//                               ))}
//                             </ul>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>}

//       </div>
//     </div >
//   );
// }
