import { useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import CreateRoomCard from "../../components/DoctorComponents/CreateRoomCard";

import { useSummaryStore } from '../../store/useSummaryStore.js'

export default function DoctorHomePage() {

  const { connectSummarySocketListeners, disconnectSummarySocketListeners} = useSummaryStore();

  // useEffect(() => {
  //   const redirectError = localStorage.getItem("redirectError");
  //   if (redirectError) {
  //     toast.error(redirectError);
  //     localStorage.removeItem("redirectError");
  //   }
  // }, []);
  useEffect(() => {
    connectSummarySocketListeners();
    return () => disconnectSummarySocketListeners();
  }, []);


  return (
    <div className="p-6 h-screen overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[250px] gap-6">
        {/* Create Room Card */}
        <div>
          <CreateRoomCard />
        </div>

        {/* Journal Summaries Link */}
        <Link to="/doctor/journal-summaries" className="hover:opacity-70 transition-all">
          <div className="card bg-base-200 shadow-md h-full">
            <div className="card-body">
              <h2 className="card-title">Journal Summaries</h2>
            </div>
          </div>
        </Link>

        {/* Emergency Summaries Link */}
        <Link to="/doctor/emergency-summaries" className="hover:opacity-70 transition-all">
          <div className="card bg-base-200 shadow-md h-full">
            <div className="card-body">
              <h2 className="card-title">Emergency Summaries</h2>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// if i integrate a new summary from the backend through a socket and combining it with the newSummaries state, then will everything render again? like if a doctor is viewing another summary whose collapse is open, will that collapse close up?
// ChatGPT said:
// Thought for 5s

// Short answer: Not necessarily — React will re-render, but whether an already-open collapse closes depends on how you render it.

// Here’s what actually happens and how to keep the collapse open (or intentionally control it).

// What React does (practical rules)

// React re-renders the component tree when state changes (e.g. you setNewSummaries([...newSummaries, newSummary])).

// DOM state is preserved for existing elements if React can match them to the same components / DOM nodes — that match is made using the key you provide in the map().

// If each summary uses a stable unique key (e.g. key={summary._id}), React will insert the new item and keep the existing items' DOM nodes and their uncontrolled state (like an unchecked/checked <input>), so an open collapse should remain open.

// If keys are unstable (e.g. using array index or keys change because you re-order or replace objects), React may destroy and recreate nodes — then the collapse state can reset (close).

// Many collapses (DaisyUI collapse, your code) rely on an uncontrolled <input type="checkbox" /> inside each mapped item. That input’s checked state is part of the DOM; it will persist across renders only if React keeps that exact DOM node (i.e., stable key).

// Why you sometimes see it close

// You add the new summary at the front and use index keys → React remaps keys and recreates nodes → controlled/uncontrolled input loses state → collapse closes.

// You replace the whole list with a new array where objects don’t preserve identity or keys change.

// You intentionally reset state elsewhere on update.

// Two robust approaches (pick one)
// A — Minimal / idiomatic: keep stable keys
// {summaries.map(s => (
//   <div key={s._id} className="collapse collapse-arrow">
//     <input type="checkbox" />
//     {/* ... */}
//   </div>
// ))}


// If you always use key={s._id} and push the new item (rather than shuffling/replacing keys), the opened collapse will stay open.

// B — Explicit control (recommended for predictable UX)

// Keep explicit open-state in React so you control which collapse is open, independent of DOM re-creation:

// // parent component
// const [openMap, setOpenMap] = useState({}); // { [id]: true }

// const toggle = (id) => {
//   setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
// };

// // in render
// {summaries.map(summary => (
//   <div key={summary._id} className="collapse collapse-arrow">
//     {/* controlled input */}
//     <input
//       type="checkbox"
//       checked={!!openMap[summary._id]}
//       onChange={() => toggle(summary._id)}
//     />
//     <div className="collapse-title">{summary.patient.fullName}</div>
//     <div className="collapse-content">...</div>
//   </div>
// ))}


// Benefits:

// Predictable: new items won’t affect existing open/closed state.

// Easy to persist which item is open, or to only allow one open at a time (use single openId instead of map).

// Extra tips

// Avoid index as key. Always use a unique stable id (_id from backend).

// If you append a new summary and want to auto-open it or scroll to it, you can set its open flag immediately and ref.scrollIntoView().

// If you use DaisyUI or similar that wraps controlled/uncontrolled behavior, switching to the controlled approach above is safest.

// For performance with many items, use a Map or useRef for open flags if you want to avoid frequent object re-creations.

// TL;DR

// If you use key={summary._id} and don’t disturb the key order, the open collapse should stay open when a new summary is pushed.

// For guaranteed, predictable behavior, maintain collapse state in React (per-summary openMap or openId) and control the checkbox with checked={...}.

// Want a tiny patch that converts your collapse to a controlled approach and optionally auto-opens a newly received summary? I can write it out.
