import StudentPortal from "@/components/student-portal";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortal>{children}</StudentPortal>;
}
