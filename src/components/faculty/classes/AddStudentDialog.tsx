"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

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
  email?: string | null;
  avatar_url?: string | null;
  organization_id?: number | null;
};

// Simple mock data generator for placeholders
function makeMockCandidate(i: number): Candidate {
  return {
    profile_id: i % 2 === 0 ? 1000 + i : undefined,
    user_id: i % 2 === 1 ? 2000 + i : undefined,
    full_name: `Candidate ${i}`,
    email: `candidate${i}@student.edu`,
    avatar_url: undefined,
    organization_id: 1,
  };
}

export default function AddStudentDialog({ open, onOpenChange, classId, onAdded }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [addingKeys, setAddingKeys] = useState<Record<string, boolean>>({});
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const [bulkAdding, setBulkAdding] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setQuery("");
      setCandidates([]);
      setSkip(0);
      setHasMore(true);
      setSelectedKeys({});
      setAddingKeys({});
      setBulkAdding(false);
    }
  }, [open]);

  // debounce searchTerm into query
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // load initial candidates (mocked)
  useEffect(() => {
    if (!open || !classId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      // simulate network
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;
      const base = Array.from({ length: 100 }).map((_, i) => makeMockCandidate(i + 1));
      const q = String(query ?? "").toLowerCase();
      const filtered = q ? base.filter((c) => (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)) : base;
      const page = filtered.slice(0, limit);
      setCandidates(page);
      setSkip(page.length);
      setHasMore(filtered.length > page.length);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [open, classId, query, limit]);

  async function loadMore() {
    if (!classId || loading || !hasMore) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    // generate same base and paging logic
    const base = Array.from({ length: 100 }).map((_, i) => makeMockCandidate(i + 1));
    const q = String(query ?? "").toLowerCase();
    const filtered = q ? base.filter((c) => (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)) : base;
    const next = filtered.slice(skip, skip + limit);
    setCandidates((p) => [...p, ...next]);
    setSkip((s) => s + next.length);
    setHasMore(filtered.length > skip + next.length);
    setLoading(false);
  }

  function candidateKey(c: Candidate) {
    if (c.profile_id != null) return `p:${c.profile_id}`;
    if (c.user_id != null) return `u:${c.user_id}`;
    return `x:${encodeURIComponent(String(c.full_name ?? "") + "|" + String(c.email ?? ""))}`;
  }

  const visibleKeys = candidates.map((c) => candidateKey(c));
  const allSelected = visibleKeys.length > 0 && visibleKeys.every((k) => Boolean(selectedKeys[k]));
  const anySelected = visibleKeys.some((k) => Boolean(selectedKeys[k]));

  async function addSingle(key: string) {
    // simulate add
    setAddingKeys((p) => ({ ...p, [key]: true }));
    await new Promise((r) => setTimeout(r, 400));
    setAddingKeys((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
    toast({ title: "Added", description: "Student added (local placeholder)" });
    onAdded?.();
    onOpenChange(false);
  }

  async function bulkAddSelected() {
    const keys = Object.keys(selectedKeys).filter((k) => selectedKeys[k]);
    if (keys.length === 0) return;
    setBulkAdding(true);
    await new Promise((r) => setTimeout(r, 600));
    setBulkAdding(false);
    toast({ title: "Added", description: `${keys.length} student(s) added (local placeholder)` });
    onAdded?.();
    onOpenChange(false);
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

                {!loading && candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">No candidates found.</TableCell>
                  </TableRow>
                )}

                {!loading && candidates.map((c, idx) => {
                  const key = candidateKey(c);
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" aria-label={`Select ${c.full_name ?? 'candidate'}`} checked={Boolean(selectedKeys[key])} onChange={(e) => {
                            setSelectedKeys((p) => ({ ...p, [key]: e.target.checked }));
                          }} />
                          <Avatar>
                            {c.avatar_url ? <AvatarImage src={c.avatar_url} alt={c.full_name ?? 'avatar'} /> : <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>}
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell>{c.full_name ?? c.email ?? 'Unknown'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" disabled={Boolean(addingKeys[key])} onClick={async () => await addSingle(key)}>
                          {addingKeys[key] ? "Adding…" : "Add"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-2 flex items-center justify-center">
              {hasMore ? (
                <Button size="sm" onClick={loadMore} disabled={loading}>{loading ? "Loading…" : "Load more"}</Button>
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
