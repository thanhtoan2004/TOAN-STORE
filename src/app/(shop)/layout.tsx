'use client';

import MaintenanceCheck from '@/components/MaintenanceCheck';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MaintenanceCheck>{children}</MaintenanceCheck>;
}
