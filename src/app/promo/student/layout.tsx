
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ưu đãi cho Học sinh - Sinh viên | TOAN",
    description: "Trương chình ưu đãi đặc biệt dành cho học sinh, sinh viên. Giảm giá 10% cho tất cả đơn hàng.",
    openGraph: {
        title: "Ưu đãi cho Học sinh - Sinh viên | TOAN",
        description: "Trương chình ưu đãi đặc biệt dành cho học sinh, sinh viên.",
    },
};

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
