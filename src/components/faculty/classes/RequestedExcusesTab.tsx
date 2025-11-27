"use client";
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { listMyExcusalRequests, ExcusalRequestOut } from '@/lib/api/attendance';
import RequestedExcusalModal from './RequestedExcusalModal';

type Props = {
  classId?: number | null;
};

export default function RequestedExcusesTab({ classId }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ExcusalRequestOut[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewItem, setViewItem] = React.useState<ExcusalRequestOut | null>(null);

  React.useEffect(() => {
    let mounted = true;
    if (!classId) {
      setItems([]);
      setError(null);
      return () => { mounted = false; };
    }

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await listMyExcusalRequests({ class_id: Number(classId), limit: 50 });
        if (!mounted) return;
        setItems(Array.isArray(res) ? res : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load excusal requests');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [classId]);

  return (
    <div className="space-y-3">
      {loading ? (
        <div>Loading excusal requests…</div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground">No excusal requests for this class.</div>
      ) : (
        <div className="overflow-auto rounded border text-sm">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="py-2 px-2 text-xs">Submitted</TableHead>
                <TableHead className="py-2 px-2 text-xs">Requested</TableHead>
                <TableHead className="py-2 px-2 text-xs">Type</TableHead>
                <TableHead className="py-2 px-2 text-xs">Status</TableHead>
                <TableHead className="py-2 px-2 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={String(it.id)}>
                  <TableCell className="whitespace-nowrap py-2 px-2">{new Date(it.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell className="whitespace-nowrap py-2 px-2">{it.requested_date ?? '-'}</TableCell>
                  <TableCell className="whitespace-nowrap py-2 px-2 font-medium">{String(it.excusal_type ?? '').charAt(0).toUpperCase() + String(it.excusal_type ?? '').slice(1)}</TableCell>
                  <TableCell className="whitespace-nowrap py-2 px-2">
                    <Badge variant={it.status === 'approved' ? 'secondary' : (it.status === 'pending' ? 'default' : 'destructive')}>{String(it.status).charAt(0).toUpperCase()+String(it.status).slice(1)}</Badge>
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <Button title="View details" size="sm" variant="ghost" onClick={() => { setViewItem(it); setViewOpen(true); }} aria-label={`View request ${it.id}`}><Eye size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RequestedExcusalModal open={viewOpen} onOpenChange={setViewOpen} request={viewItem} />
    </div>
  );
}
