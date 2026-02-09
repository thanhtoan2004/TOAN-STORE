
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ưu đãi sinh nhật - Nike Clone",
    description: "Nhận quà tặng đặc biệt nhân dịp sinh nhật của bạn từ Nike Clone. Giảm giá lên đến 20% và nhiều phần quà hấp dẫn khác.",
    openGraph: {
        title: "Ưu đãi sinh nhật - Nike Clone",
        description: "Nhận quà tặng đặc biệt nhân dịp sinh nhật của bạn từ Nike Clone.",
        images: ['/images/promo-birthday.jpg'], // Hãy đảm bảo có ảnh này hoặc dùng ảnh mặc định
    },
};

export default function BirthdayLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
