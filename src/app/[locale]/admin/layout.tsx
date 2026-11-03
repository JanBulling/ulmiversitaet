import type { Metadata } from "next";

// Not linked from the public site; keep it out of search engines as well
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: LayoutProps<"/[locale]/admin">) {
  return children;
}
