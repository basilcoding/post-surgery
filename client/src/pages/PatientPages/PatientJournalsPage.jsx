import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Search, RefreshCw, FileText, MessageSquare, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axiosInstance"; // <- adjust path to your axios wrapper

/**
 * PatientJournalPage
 * - Shows the patient's Journal summaries split into New, UnderReview, Resolved
 * - Client-side grouping by top-level `status`
 * - Lightweight search (content + questions)
 * - Quick view dialog for a summary
 */
export default function PatientJournalPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState([]);
  const [activeTab, setActiveTab] = useState("New");
  const [q, setQ] = useState("");

  // Fetch all journal summaries for the logged-in patient
  // Assumed API: GET /summaries?type=journal&mine=true or /me/summaries?type=journal
  // Adjust to your server route. We fetch once, then group client-side.
  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosInstance.get("/summaries", {
        params: { type: "journal", mine: true }, // change if your API expects a different param
        withCredentials: true,
      });
      const list = res?.data?.summaries || res?.data || [];
      setSummaries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to load journals";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return summaries;
    const term = q.trim().toLowerCase();
    return summaries.filter((s) => {
      const content = Array.isArray(s?.content) ? s.content.join(" ") : String(s?.content || "");
      const questions = Array.isArray(s?.questionsAsked) ? s.questionsAsked.join(" ") : "";
      const doctorName = s?.assignedDoctor?.name || s?.assignedDoctor?.fullName || "";
      return (
        content.toLowerCase().includes(term) ||
        questions.toLowerCase().includes(term) ||
        doctorName.toLowerCase().includes(term)
      );
    });
  }, [q, summaries]);

  const grouped = useMemo(() => {
    const buckets = { New: [], UnderReview: [], Resolved: [] };
    for (const s of filtered) {
      const key = s?.status || "New";
      if (buckets[key]) buckets[key].push(s);
    }
    // newest first
    for (const k of Object.keys(buckets)) {
      buckets[k].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return buckets;
  }, [filtered]);

  const StatusBadge = ({ status }) => {
    const map = {
      New: { label: "New", className: "bg-blue-600" },
      UnderReview: { label: "Under review", className: "bg-amber-600" },
      Resolved: { label: "Resolved", className: "bg-emerald-600" },
    };
    const item = map[status] || map.New;
    return <Badge className={`text-white ${item.className}`}>{item.label}</Badge>;
  };

  const JournalCard = ({ s }) => {
    const created = s?.createdAt ? format(new Date(s.createdAt), "PPp") : "—";
    const updated = s?.updatedAt ? format(new Date(s.updatedAt), "PPp") : null;
    const doctor = s?.assignedDoctor?.name || s?.assignedDoctor?.fullName || s?.assignedDoctor?.email;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle className="text-base">Journal entry</CardTitle>
            </div>
            <StatusBadge status={s?.status} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <span>Created: {created}</span>
              {updated && <span className="ml-3">• Updated: {updated}</span>}
            </div>

            {doctor && (
              <div className="text-sm">Assigned doctor: <span className="font-medium">{doctor}</span></div>
            )}

            {Array.isArray(s?.content) && s.content.length > 0 ? (
              <p className="text-sm leading-relaxed line-clamp-3">{s.content.join(" \n")}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No notes in this entry.</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>{(s?.questionsAsked?.length || 0)} question(s)</span>
              </div>
              <div className="text-xs text-muted-foreground">rev {s?.revision ?? 0}</div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">Quick view</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Journal details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div>Created: {created}</div>
                      {updated && <div>Updated: {updated}</div>}
                      {doctor && <div>Assigned doctor: {doctor}</div>}
                      <div>Status: {s?.status}</div>
                      {s?.resolvedAt && (
                        <div>Resolved at: {format(new Date(s.resolvedAt), "PPp")}</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Bot notes</h4>
                      {Array.isArray(s?.content) && s.content.length > 0 ? (
                        <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap">
                          {s.content.join("\n\n")}
                        </div>
                      ) : (
                        <div className="text-sm italic text-muted-foreground">No notes</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Questions asked</h4>
                      {Array.isArray(s?.questionsAsked) && s.questionsAsked.length > 0 ? (
                        <ul className="list-disc pl-6 text-sm space-y-1">
                          {s.questionsAsked.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm italic text-muted-foreground">No questions recorded</div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="sm" onClick={() => navigate(`/journals/${s._id}`)}>
                Open <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const Empty = ({ label, action }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 border rounded-2xl">
      <FileText className="w-8 h-8 mb-2" />
      <div className="text-sm text-muted-foreground">{label}</div>
      {action}
    </div>
  );

  const Column = ({ list }) => (
    <ScrollArea className="h-[calc(100vh-18rem)] pr-2">
      <div className="grid gap-3">
        {list.map((s) => (
          <JournalCard key={s._id} s={s} />
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">My Journals</h1>
          <p className="text-sm text-muted-foreground">Review your journal entries and see their review status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchSummaries} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-8 w-64"
              placeholder="Search notes, questions, doctor..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:w-[520px]">
            <TabsTrigger value="New">New ({grouped.New.length})</TabsTrigger>
            <TabsTrigger value="UnderReview">Under review ({grouped.UnderReview.length})</TabsTrigger>
            <TabsTrigger value="Resolved">Resolved ({grouped.Resolved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="New" className="mt-4">
            {grouped.New.length ? (
              <Column list={grouped.New} />
            ) : (
              <Empty label="No new journals." />
            )}
          </TabsContent>

          <TabsContent value="UnderReview" className="mt-4">
            {grouped.UnderReview.length ? (
              <Column list={grouped.UnderReview} />
            ) : (
              <Empty label="Nothing under review yet." />
            )}
          </TabsContent>

          <TabsContent value="Resolved" className="mt-4">
            {grouped.Resolved.length ? (
              <Column list={grouped.Resolved} />
            ) : (
              <Empty label="No resolved journals yet." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
