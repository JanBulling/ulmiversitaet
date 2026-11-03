import { Page } from "@/components/layout/page";

export default function MensaLayout({
  children,
}: LayoutProps<"/[locale]/mensa">) {
  return <Page>{children}</Page>;
}
