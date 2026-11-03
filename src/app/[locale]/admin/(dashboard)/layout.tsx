import { Page } from "@/components/layout/page";
import { AdminNav } from "@/features/admin/components/admin-nav";

export default function DashboardLayout({
  children,
}: LayoutProps<"/[locale]/admin">) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AdminNav />
      <main className="flex-1">
        <Page>{children}</Page>
      </main>
    </div>
  );
}
