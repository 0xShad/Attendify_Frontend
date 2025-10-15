"use client"

import * as React from "react"
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
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
  IconRefresh,
} from "@tabler/icons-react"
import { Eye, Edit, Trash2, Activity, AlertCircle, CheckCircle, XCircle } from "lucide-react"
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
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const logSchema = z.object({
  id: z.union([z.number(), z.string()]),
  timestamp: z.string(),
  userId: z.string(),
  activity: z.string(),
  status: z.enum(["success", "warning", "error"]),
  ipAddress: z.string().optional(),
  details: z.string().optional(),
})

// Log action components
function ViewLogSheet({ log, open, onOpenChange }: { 
  log: z.infer<typeof logSchema>; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-w-lg sm:mx-auto px-6 sm:px-8">
        <div className="mx-auto max-w-md">
          <SheetHeader className="space-y-4 text-center">
            <SheetTitle className="text-xl">Log Details</SheetTitle>
            <SheetDescription>
              View detailed information about this log entry
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-8 space-y-6">
            {/* Log Icon and Basic Info */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${
                log.status === "success" 
                  ? "bg-green-500" 
                  : log.status === "error" 
                  ? "bg-red-500" 
                  : "bg-yellow-500"
              }`}>
                {log.status === "success" && <CheckCircle className="w-8 h-8" />}
                {log.status === "error" && <XCircle className="w-8 h-8" />}
                {log.status === "warning" && <AlertCircle className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{log.activity}</h3>
                <p className="text-sm text-muted-foreground">ID: {log.id}</p>
              </div>
            </div>

            {/* Log Details */}
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        log.status === "success"
                          ? "bg-green-500"
                          : log.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-sm capitalize">{log.status}</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                  <p className="text-sm">{log.userId}</p>
                </div>
                
                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Timestamp</Label>
                  <p className="text-sm">{log.timestamp}</p>
                </div>
                
                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">IP Address</Label>
                  <p className="text-sm">{log.ipAddress || "N/A"}</p>
                </div>
                
                {log.details && (
                  <div className="space-y-2 text-center">
                    <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                    <p className="text-sm">{log.details}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <SheetFooter className="pb-8">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function EditLogSheet({ log, open, onOpenChange }: { 
  log: z.infer<typeof logSchema>; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [editDetails, setEditDetails] = React.useState(log.details || "")

  React.useEffect(() => {
    setEditDetails(log.details || "")
  }, [log])

  const handleSave = () => {
    console.log("Saving log:", { editDetails })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-w-lg sm:mx-auto px-6 sm:px-8">
        <div className="mx-auto max-w-md">
          <SheetHeader className="space-y-4 text-center">
            <SheetTitle className="text-xl">Edit Log</SheetTitle>
            <SheetDescription>
              Update log entry details and notes
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-8 space-y-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="edit-details" className="text-sm font-medium">Log Details</Label>
                <Input
                  id="edit-details"
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  placeholder="Enter log details"
                  className="w-full"
                />
              </div>
              
              {/* Read-only fields for context */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Activity</Label>
                    <p className="font-medium">{log.activity}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="font-medium">{log.userId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className={`font-medium capitalize ${
                      log.status === "success" 
                        ? "text-green-600" 
                        : log.status === "error" 
                        ? "text-red-600" 
                        : "text-yellow-600"
                    }`}>
                      {log.status}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p className="font-medium">{log.timestamp}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <SheetFooter className="flex gap-4 pb-8">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DeleteLogDialog({ log, open, onOpenChange }: { 
  log: z.infer<typeof logSchema>; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmText, setConfirmText] = React.useState("")
  const expectedText = "DELETE"

  const handleDelete = () => {
    console.log("Deleting log:", log.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-sm mx-auto rounded-2xl border shadow-lg p-4">
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-destructive text-lg">
            <Trash2 className="w-5 h-5" />
            Delete Log Entry
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p className="text-sm text-center">This action cannot be undone. This will permanently delete the log entry.</p>
            
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  log.status === "success" 
                    ? "bg-green-500" 
                    : log.status === "error" 
                    ? "bg-red-500" 
                    : "bg-yellow-500"
                }`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{log.activity}</p>
                  <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3 text-center">
            <Label htmlFor="confirm-delete" className="text-sm">
              Type <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">DELETE</code> to confirm
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 text-sm">
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
  )
}

function LogActionsCell({ log }: { log: z.infer<typeof logSchema> }) {
  const [viewOpen, setViewOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

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
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewLogSheet log={log} open={viewOpen} onOpenChange={setViewOpen} />
      <EditLogSheet log={log} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteLogDialog log={log} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number | string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

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
  )
}

const columns: ColumnDef<z.infer<typeof logSchema>>[] = [
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
          row.original.status === "success"
            ? "bg-green-500"
            : row.original.status === "error"
            ? "bg-red-500"
            : "bg-yellow-500"
        }`}>
          {row.original.status === "success" && <CheckCircle className="w-4 h-4" />}
          {row.original.status === "error" && <XCircle className="w-4 h-4" />}
          {row.original.status === "warning" && <AlertCircle className="w-4 h-4" />}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground">
        {row.original.timestamp}
      </span>
    ),
  },
  {
    accessorKey: "userId",
    header: "User ID",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.userId}
      </Badge>
    ),
  },
  {
    accessorKey: "activity",
    header: "Activity",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.activity}</div>
        {row.original.ipAddress && (
          <div className="text-xs text-muted-foreground">IP: {row.original.ipAddress}</div>
        )}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.details || "N/A"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <LogActionsCell log={row.original} />
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof logSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

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
  )
}

export function LogsDataTable({
  data: initialData,
}: {
  data: z.infer<typeof logSchema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [userFilter, setUserFilter] = React.useState("all")
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

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
  })

  // Apply filters to data
  React.useEffect(() => {
    let filteredData = [...initialData]
    
    if (statusFilter !== "all") {
      filteredData = filteredData.filter(item => item.status === statusFilter)
    }
    
    if (userFilter !== "all") {
      filteredData = filteredData.filter(item => item.userId === userFilter)
    }
    
    setData(filteredData)
  }, [statusFilter, userFilter, initialData])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const handleRefresh = () => {
    console.log("Refreshing logs...")
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      {/* Table Title */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">System Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor system activities and user actions
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Success</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Error</span>
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
                  )
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
                  Configure filters to refine the log data
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-6 py-4 max-w-md mx-auto w-full md:max-w-2xl md:grid-cols-2 md:gap-8">
                <div className="grid gap-3">
                  <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="user-filter" className="text-sm font-medium">User</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger id="user-filter" className="w-full">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="U001">U001</SelectItem>
                      <SelectItem value="U002">U002</SelectItem>
                      <SelectItem value="U003">U003</SelectItem>
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
                      setStatusFilter("all")
                      setUserFilter("all")
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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <IconRefresh />
            <span className="hidden lg:inline">Refresh</span>
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
                  <TableRow key={headerGroup.id} className="border-b-primary/20">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} className="text-primary font-semibold">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
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
                  table.setPageSize(Number(value))
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
  )
}