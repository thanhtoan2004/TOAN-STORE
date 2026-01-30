'use client';

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MaintenanceCheck from "@/components/MaintenanceCheck";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MaintenanceCheck>{children}</MaintenanceCheck>;
}
