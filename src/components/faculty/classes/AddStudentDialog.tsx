"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import resolveAvatarUrl from '@/lib/utils/resolveAvatarUrl';
import { useToast } from "@/hooks/use-toast";
import { classesAPI } from "@/lib/api/classes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: number | null;
  onAdded?: () => void;
};

type Candidate = {
  profile_id?: number | null;
  user_id?: number | null;
  full_name?: string | null;
  avatar_url?: string | null;
  organization_id?: number | null;
};

export default function AddStudentDialog({ open, onOpenChange, classId, onAdded }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState(""); // debounced query that is sent to API
  const [skip, setSkip] = useState(0);
  const [skipRaw, setSkipRaw] = useState(0); // how many items we've requested from the API (for pagination)
  const [limit] = useState(50);
  const [hasMore, setHasMore] = useState(true);
  const [addingIds, setAddingIds] = useState<number[]>([]);
  const [failedAvatarIndexes, setFailedAvatarIndexes] = useState<Record<number, boolean>>({});
  const [enrolledProfileIds, setEnrolledProfileIds] = useState<Record<number, boolean>>({});
  const [enrolledUserIds, setEnrolledUserIds] = useState<Record<number, boolean>>({});
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const [bulkAdding, setBulkAdding] = useState(false);

  // use shared resolveAvatarUrl helper

  function resetState() {
    setSearchTerm("");
    setQuery("");
    setCandidates([]);
    setSkip(0);
    setSkipRaw(0);
    setHasMore(true);
    setAddingIds([]);
    setLoading(false);
    setEnrolledProfileIds({});
    setEnrolledUserIds({});
    setSelectedKeys({});
  }

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  useEffect(() => {
    if (!open || !classId) return;
    let cancelled = false;
    async function loadInitial() {
      setLoading(true);
      try {
        const enrolleeData = await classesAPI.getMyClassEnrollees(Number(classId));
        const enrolArr = Array.isArray(enrolleeData) ? enrolleeData : [];
        const profileMap: Record<number, boolean> = {};
        const userMap: Record<number, boolean> = {};
        enrolArr.forEach((en: any) => {
          if (en?.profile_id) profileMap[Number(en.profile_id)] = true;
          if (en?.user_id) userMap[Number(en.user_id)] = true;
        });
        if (cancelled) return;
        setEnrolledProfileIds(profileMap);
        setEnrolledUserIds(userMap);

        const data = await classesAPI.listAvailableStudentsForMyClass(Number(classId), query, 0, limit);
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : [];
        const filteredArr = arr.filter((c: Candidate) => {
          if (c.profile_id && profileMap[Number(c.profile_id)]) return false;
          if (c.user_id && userMap[Number(c.user_id)]) return false;
          return true;
        });
        setCandidates(filteredArr);
        setSkip(filteredArr.length);
        setSkipRaw(arr.length);
        setHasMore(arr.length === limit);
      } catch (err: any) {
        console.error("Failed to load candidate students", err);
        toast({ title: "Error", description: "Failed to load students to add", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInitial();
    return () => { cancelled = true; };
  }, [open, classId, query, limit]);

  async function loadMore() {
    if (!classId || loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await classesAPI.listAvailableStudentsForMyClass(Number(classId), query, skipRaw, limit);
      const arr = Array.isArray(data) ? data : [];
      const filteredArr = arr.filter((c: Candidate) => {
        if (c.profile_id && enrolledProfileIds[Number(c.profile_id)]) return false;
        if (c.user_id && enrolledUserIds[Number(c.user_id)]) return false;
        return true;
      });
      setCandidates((p) => [...p, ...filteredArr]);
      setSkip((s) => s + filteredArr.length);
      setSkipRaw((s) => s + arr.length);
      setHasMore(arr.length === limit);
    } catch (err: any) {
      console.error("Failed to load more candidates", err);
      toast({ title: "Error", description: "Failed to load more students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filtered = candidates;

  function candidateKey(c: Candidate, idx: number) {
    if (c.profile_id) return `p:${c.profile_id}`;
    if (c.user_id) return `u:${c.user_id}`;
    return `i:${idx}`;
  }

  const visibleKeys = filtered.map((c, idx) => candidateKey(c, idx));
  const allSelected = visibleKeys.length > 0 && visibleKeys.every((k) => Boolean(selectedKeys[k]));
  const anySelected = visibleKeys.some((k) => Boolean(selectedKeys[k]));

  async function bulkAddSelected() {
    if (!classId) return;
    const keys = Object.keys(selectedKeys).filter((k) => selectedKeys[k]);
    if (keys.length === 0) return;
    setBulkAdding(true);
    try {
      const payloads = keys.map((key) => {
        const parts = key.split(':');
        if (parts[0] === 'p') return { profile_id: Number(parts[1]) };
        if (parts[0] === 'u') return { user_id: Number(parts[1]) };
        const idx = Number(parts[1]);
        const c = filtered[idx];
        return { profile_id: c?.profile_id ?? null, user_id: c?.user_id ?? null };
      });
      await classesAPI.addEnrolleeToClass(Number(classId), payloads);
      toast({ title: "Added", description: `${keys.length} student(s) added to class` });
      onAdded?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to bulk-add students", err);
      toast({ title: "Error", description: String(err?.message || "Failed to add students"), variant: "destructive" });
    } finally {
      setBulkAdding(false);
    }
  }

  function getInitials(name?: string | null) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add student to class</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="mb-3">
            <Input placeholder="Search by name or email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="max-h-[50vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={(e) => {
                      const next: Record<string, boolean> = { ...selectedKeys };
                      if (e.target.checked) {
                        visibleKeys.forEach((k) => { next[k] = true; });
                      } else {
                        visibleKeys.forEach((k) => { delete next[k]; });
                      }
                      setSelectedKeys(next);
                    }} />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">Loading candidates…</TableCell>
                  </TableRow>
                )}

                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">No candidates found.</TableCell>
                  </TableRow>
                )}

                {!loading && filtered.map((c, idx) => {
                  const key = candidateKey(c, idx);
                  return (
                    <TableRow key={c.profile_id ?? c.user_id ?? idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" aria-label={`Select ${c.full_name ?? 'candidate'}`} checked={Boolean(selectedKeys[key])} onChange={(e) => {
                            setSelectedKeys((p) => ({ ...p, [key]: e.target.checked }));
                          }} />
                          <Avatar>
                            {c.avatar_url && !failedAvatarIndexes[idx] ? (
                              <AvatarImage src={String(resolveAvatarUrl(c.avatar_url) ?? undefined)} alt={c.full_name ?? 'avatar'} onError={() => setFailedAvatarIndexes((p) => ({ ...p, [idx]: true }))} />
                            ) : null}
                            <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell>{c.full_name ?? "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" disabled={addingIds.includes(idx)} onClick={async () => {
                          if (!classId) return;
                          setAddingIds((p) => [...p, idx]);
                          try {
                            await classesAPI.addEnrolleeToClass(Number(classId), { profile_id: c.profile_id ?? null, user_id: c.user_id ?? null });
                            toast({ title: "Added", description: `${c.full_name ?? 'Student'} added to class` });
                            onAdded?.();
                            onOpenChange(false);
                          } catch (err: any) {
                            console.error("Failed to add student", err);
                            toast({ title: "Error", description: String(err?.message || "Failed to add student"), variant: "destructive" });
                          } finally {
                            setAddingIds((p) => p.filter((i) => i !== idx));
                          }
                        }}>{addingIds.includes(idx) ? "Adding…" : "Add"}</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-2 flex items-center justify-center">
              {hasMore ? (
                <Button size="sm" onClick={loadMore} disabled={loading}>
                  {loading ? "Loading…" : "Load more"}
                </Button>
              ) : (
                candidates.length > 0 && <span className="text-sm text-muted-foreground">End of results</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end items-center space-x-2">
            <Button size="sm" disabled={!anySelected || bulkAdding} onClick={bulkAddSelected}>
              {bulkAdding ? "Adding…" : `Add Selected (${Object.keys(selectedKeys).filter(k => selectedKeys[k]).length})`}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
