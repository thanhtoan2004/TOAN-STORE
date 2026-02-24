
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ưu đãi cho Giáo viên | TOAN Store",
    description: "Lời tri ân đến các thầy cô giáo. Nhận ưu đãi đặc quyền lên đến 15% tại TOAN Store.",
    openGraph: {
        title: "Ưu đãi cho Giáo viên | TOAN Store",
        description: "Lời tri ân đến các thầy cô giáo. Nhận ưu đãi đặc quyền lên đến 15% tại TOAN Store.",
    },
};

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
