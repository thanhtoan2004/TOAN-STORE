'use client';

import { usePathname } from 'next/navigation';
import Header from './layout/Header';
import Footer from './layout/Footer';
import MaintenanceCheck from './MaintenanceCheck';

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname && pathname.startsWith('/admin');
  const isMaintenancePage = pathname === '/maintenance';

  // Skip maintenance check for admin and maintenance page itself
  if (isAdminRoute || isMaintenancePage) {
    return (
      <>
        {!isAdminRoute && <Header />}
        <main>{children}</main>
        {!isAdminRoute && <Footer />}
      </>
    );
  }

  // Wrap with maintenance check for regular users
  return (
    <MaintenanceCheck>
      <Header />
      <main>{children}</main>
      <Footer />
    </MaintenanceCheck>
  );
}
