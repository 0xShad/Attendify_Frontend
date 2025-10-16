"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconFilter,
  IconGripVertical,
  IconLayoutColumns,
  IconDownload,
} from "@tabler/icons-react";
import {
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const reportSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  createdDate: z.string(),
  size: z.string().optional(),
  createdBy: z.string(),
});

// Report action components
function ViewReportSheet({
  report,
  open,
  onOpenChange,
}: {
  report: z.infer<typeof reportSchema>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] sm:h-auto sm:max-w-lg sm:mx-auto px-6 sm:px-8"
      >
        <div className="mx-auto max-w-md">
          <SheetHeader className="space-y-4 text-center">
            <SheetTitle className="text-xl">Report Details</SheetTitle>
            <SheetDescription>
              View detailed information about this report
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {/* Report Icon and Basic Info */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{report.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {report.id}</p>
              </div>
            </div>

            {/* Report Details */}
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Type
                  </Label>
                  <Badge variant="outline">{report.type}</Badge>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        report.status === "Completed"
                          ? "bg-green-500"
                          : report.status === "Processing"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm">{report.status}</span>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    File Size
                  </Label>
                  <p className="text-sm">{report.size || "N/A"}</p>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Created Date
                  </Label>
                  <p className="text-sm">{report.createdDate}</p>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Created By
                  </Label>
                  <p className="text-sm">{report.createdBy}</p>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="pb-8">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EditReportSheet({
  report,
  open,
  onOpenChange,
}: {
  report: z.infer<typeof reportSchema>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editName, setEditName] = React.useState(report.name || "");
  const [editType, setEditType] = React.useState(report.type || "");

  React.useEffect(() => {
    setEditName(report.name || "");
    setEditType(report.type || "");
  }, [report]);

  const handleSave = () => {
    console.log("Saving report:", { editName, editType });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] sm:h-auto sm:max-w-lg sm:mx-auto px-6 sm:px-8"
      >
        <div className="mx-auto max-w-md">
          <SheetHeader className="space-y-4 text-center">
            <SheetTitle className="text-xl">Edit Report</SheetTitle>
            <SheetDescription>
              Update report information and settings
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Report Name
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter report name"
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="edit-type" className="text-sm font-medium">
                  Report Type
                </Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Attendance Report">
                      Attendance Report
                    </SelectItem>
                    <SelectItem value="User Activity">User Activity</SelectItem>
                    <SelectItem value="System Performance">
                      System Performance
                    </SelectItem>
                    <SelectItem value="Custom Report">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="flex gap-4 pb-8">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DeleteReportDialog({
  report,
  open,
  onOpenChange,
}: {
  report: z.infer<typeof reportSchema>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmText, setConfirmText] = React.useState("");
  const expectedText = "DELETE";

  const handleDelete = () => {
    console.log("Deleting report:", report.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-sm mx-auto rounded-2xl border shadow-lg p-4">
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-destructive text-lg">
            <Trash2 className="w-5 h-5" />
            Delete Report
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p className="text-sm text-center">
              This action cannot be undone. This will permanently delete the
              report.
            </p>

            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {report.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{report.type}</p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 text-center">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type{" "}
              <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
                DELETE
              </code>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="text-center text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex-1 text-sm"
            disabled={confirmText !== expectedText}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportActionsCell({
  report,
}: {
  report: z.infer<typeof reportSchema>;
}) {
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewReportSheet
        report={report}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <EditReportSheet
        report={report}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteReportDialog
        report={report}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number | string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof reportSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Report Name",
    cell: ({ row }) => {
      const report = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">{report.name}</div>
            <div className="text-xs text-muted-foreground">ID: {report.id}</div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            row.original.status === "Completed"
              ? "bg-green-500"
              : row.original.status === "Processing"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            row.original.status === "Completed"
              ? "text-green-700"
              : row.original.status === "Processing"
              ? "text-yellow-700"
              : "text-red-700"
          }`}
        >
          {row.original.status}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.size || "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "createdDate",
    header: "Created Date",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.createdDate}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ReportActionsCell report={row.original} />,
  },
];

function DraggableRow({ row }: { row: Row<z.infer<typeof reportSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ReportsDataTable({
  data: initialData,
}: {
  data: z.infer<typeof reportSchema>[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Apply filters to data
  React.useEffect(() => {
    let filteredData = [...initialData];

    if (statusFilter !== "all") {
      filteredData = filteredData.filter(
        (item) => item.status === statusFilter
      );
    }

    if (typeFilter !== "all") {
      filteredData = filteredData.filter((item) => item.type === typeFilter);
    }

    setData(filteredData);
  }, [statusFilter, typeFilter, initialData]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const handleExport = () => {
    console.log("Exporting reports...");
  };

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      {/* Table Title */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Reports Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, view, and manage system reports
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Processing</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Failed</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter />
                <span className="hidden lg:inline">Filter</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-6 pb-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>Filter Options</DrawerTitle>
                <DrawerDescription>
                  Configure filters to refine the table data
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-6 py-4 max-w-md mx-auto w-full md:max-w-2xl md:grid-cols-2 md:gap-8">
                <div className="grid gap-3">
                  <Label
                    htmlFor="status-filter"
                    className="text-sm font-medium"
                  >
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="type-filter" className="text-sm font-medium">
                    Type
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Attendance Report">
                        Attendance Report
                      </SelectItem>
                      <SelectItem value="User Activity">
                        User Activity
                      </SelectItem>
                      <SelectItem value="System Performance">
                        System Performance
                      </SelectItem>
                      <SelectItem value="Custom Report">
                        Custom Report
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DrawerFooter className="px-0 pt-4">
                <div className="flex gap-3 max-w-md mx-auto w-full md:max-w-2xl">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                  <DrawerClose asChild>
                    <Button className="flex-1">Apply Filters</Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <IconDownload />
            <span className="hidden lg:inline">Export</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b-primary/20"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className="text-primary font-semibold"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
