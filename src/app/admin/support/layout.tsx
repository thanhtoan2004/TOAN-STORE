import AdminLayout from '@/components/admin/AdminLayout';

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayout>{children}</AdminLayout>;
}
