import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
