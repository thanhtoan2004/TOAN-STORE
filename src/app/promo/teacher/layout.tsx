
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ưu đãi cho Giáo viên | Nike Clone",
    description: "Lời tri ân đến các thầy cô giáo. Nhận ưu đãi đặc quyền lên đến 15% tại Nike Clone.",
    openGraph: {
        title: "Ưu đãi cho Giáo viên | Nike Clone",
        description: "Lời tri ân đến các thầy cô giáo. Nhận ưu đãi đặc quyền lên đến 15% tại Nike Clone.",
    },
};

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
