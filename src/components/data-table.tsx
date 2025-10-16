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
  IconCircleCheckFilled,
  IconDotsVertical,
  IconFilter,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Eye, Edit, UserX, Trash2 } from "lucide-react";
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

export const schema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  email: z.string().optional(),
  role: z.string(),
  status: z.string(),
  lastActive: z.string().optional(),
  department: z.string().optional(),
});

// User action components
function ViewUserSheet({
  user,
  open,
  onOpenChange,
}: {
  user: z.infer<typeof schema>;
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
            <SheetTitle className="text-xl">User Profile</SheetTitle>
            <SheetDescription>
              View detailed information about this user
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {/* User Avatar and Basic Info */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-500 flex items-center justify-center text-white text-xl font-medium">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "?"}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {user.name || "Unknown User"}
                </h3>
                <p className="text-sm text-muted-foreground">ID: {user.id}</p>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </Label>
                  <p className="text-sm">{user.email || "Not provided"}</p>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Role
                  </Label>
                  <div className="flex justify-center">
                    <Badge
                      variant={
                        user.role === "Admin"
                          ? "default"
                          : user.role === "Faculty"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.status === "Active"
                          ? "bg-green-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <span className="text-sm">{user.status}</span>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Department
                  </Label>
                  <p className="text-sm">{user.department || "Not assigned"}</p>
                </div>

                <div className="space-y-2 text-center">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Last Active
                  </Label>
                  <p className="text-sm">{user.lastActive || "Never"}</p>
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

function EditUserSheet({
  user,
  open,
  onOpenChange,
}: {
  user: z.infer<typeof schema>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editName, setEditName] = React.useState(user.name || "");
  const [editEmail, setEditEmail] = React.useState(user.email || "");
  const [editRole, setEditRole] = React.useState(user.role || "");
  const [editDepartment, setEditDepartment] = React.useState(
    user.department || ""
  );

  React.useEffect(() => {
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "");
    setEditDepartment(user.department || "");
  }, [user]);

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving user:", {
      editName,
      editEmail,
      editRole,
      editDepartment,
    });
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
            <SheetTitle className="text-xl">Edit User</SheetTitle>
            <SheetDescription>
              Update user information and settings
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="edit-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="edit-role" className="text-sm font-medium">
                  Role
                </Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Administrator</SelectItem>
                    <SelectItem value="Faculty">Faculty Member</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="edit-department"
                  className="text-sm font-medium"
                >
                  Department
                </Label>
                <Input
                  id="edit-department"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="Enter department"
                  className="w-full"
                />
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

function DeactivateUserSheet({
  user,
  open,
  onOpenChange,
}: {
  user: z.infer<typeof schema>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = React.useState("");

  const handleDeactivate = () => {
    // TODO: Implement deactivate logic
    console.log("Deactivating user:", user.id, "Reason:", reason);
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
            <SheetTitle className="text-xl">Deactivate User</SheetTitle>
            <SheetDescription>
              Temporarily disable this user account
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {/* User Info */}
            <div className="flex flex-col items-center gap-3 p-6 bg-muted/30 rounded-lg">
              <div className="w-14 h-14 rounded-full bg-slate-500 flex items-center justify-center text-white text-sm font-medium">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "?"}
              </div>
              <div className="text-center">
                <p className="font-medium">{user.name || "Unknown User"}</p>
                <p className="text-sm text-muted-foreground">
                  {user.email || "No email"}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="deactivate-reason"
                  className="text-sm font-medium"
                >
                  Reason for Deactivation
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temporary_leave">
                      Temporary Leave
                    </SelectItem>
                    <SelectItem value="policy_violation">
                      Policy Violation
                    </SelectItem>
                    <SelectItem value="inactive_account">
                      Inactive Account
                    </SelectItem>
                    <SelectItem value="user_request">User Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  <strong>Note:</strong> Deactivating this user will prevent
                  them from logging in. Their data will be preserved and the
                  account can be reactivated later.
                </p>
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
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              className="flex-1"
              disabled={!reason}
            >
              Deactivate User
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: {
  user: z.infer<typeof schema>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmText, setConfirmText] = React.useState("");
  const expectedText = "DELETE";

  const handleDelete = () => {
    // TODO: Implement delete logic
    console.log("Deleting user:", user.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-sm mx-auto rounded-2xl border shadow-lg p-4">
        <DialogHeader className="space-y-3 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-destructive text-lg">
            <Trash2 className="w-5 h-5" />
            Delete User
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p className="text-sm text-center">
              This action cannot be undone. This will permanently delete the
              user account and remove all associated data.
            </p>

            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "?"}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {user.name || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email || "No email"}
                  </p>
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

function UserActionsCell({ user }: { user: z.infer<typeof schema> }) {
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
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
          <DropdownMenuItem onClick={() => setDeactivateOpen(true)}>
            <UserX className="w-4 h-4 mr-2" />
            Deactivate
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

      {/* Action Modals */}
      <ViewUserSheet user={user} open={viewOpen} onOpenChange={setViewOpen} />
      <EditUserSheet user={user} open={editOpen} onOpenChange={setEditOpen} />
      <DeactivateUserSheet
        user={user}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />
      <DeleteUserDialog
        user={user}
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

const columns: ColumnDef<z.infer<typeof schema>>[] = [
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
    header: "User",
    cell: ({ row }) => {
      const user = row.original;
      const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "?";

      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          <div>
            <div className="font-medium">{user.name || "Unknown User"}</div>
            {user.email && (
              <div className="text-sm text-muted-foreground">{user.email}</div>
            )}
            <div className="text-xs text-muted-foreground">ID: {user.id}</div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.role === "Admin"
            ? "default"
            : row.original.role === "Faculty"
            ? "secondary"
            : "outline"
        }
      >
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            row.original.status === "Active"
              ? "bg-green-500"
              : "bg-muted-foreground"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            row.original.status === "Active"
              ? "text-green-700"
              : "text-muted-foreground"
          }`}
        >
          {row.original.status}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.department || "Not assigned"}
      </span>
    ),
  },
  {
    accessorKey: "lastActive",
    header: "Last Active",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.lastActive || "Never"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  },
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
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

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[];
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
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState("");
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
      filteredData = filteredData.filter((item) => item.role === typeFilter);
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

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      {/* Table Title */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor user accounts and permissions
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Active Users</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>Inactive Users</span>
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
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="role-filter" className="text-sm font-medium">
                    Role
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="role-filter" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Admin">Administrator</SelectItem>
                      <SelectItem value="Faculty">Faculty Member</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
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
          <Drawer open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Add User</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-6 pb-6">
              <DrawerHeader className="px-0">
                <DrawerTitle>Add New User</DrawerTitle>
                <DrawerDescription>
                  Create a new user account for the system
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-6 py-4 max-w-md mx-auto w-full">
                <div className="grid gap-3">
                  <Label htmlFor="user-name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="user-name"
                    placeholder="Enter full name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="user-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="Enter email address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="user-role" className="text-sm font-medium">
                    Role
                  </Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Administrator</SelectItem>
                      <SelectItem value="Faculty">Faculty Member</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DrawerFooter className="px-0 pt-4">
                <div className="flex gap-3 max-w-md mx-auto w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setNewUserName("");
                      setNewUserEmail("");
                      setNewUserRole("");
                      setIsAddUserOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // Handle add user logic here
                        console.log("Adding user:", {
                          newUserName,
                          newUserEmail,
                          newUserRole,
                        });
                        setNewUserName("");
                        setNewUserEmail("");
                        setNewUserRole("");
                      }}
                    >
                      Add User
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
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
