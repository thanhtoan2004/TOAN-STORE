"use client";
import { ChevronDown } from "lucide-react";

interface SortOption {
    label: string;
    value: string;
}

interface SortDropdownProps {
    value: string;
    onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
    const sortOptions: SortOption[] = [
        { label: 'Mới nhất', value: 'newest' },
        { label: 'Giá: Thấp đến cao', value: 'price_asc' },
        { label: 'Giá: Cao đến thấp', value: 'price_desc' },
        { label: 'Tên: A-Z', value: 'name_asc' },
        { label: 'Tên: Z-A', value: 'name_desc' },
    ];

    const currentLabel = sortOptions.find(opt => opt.value === value)?.label || 'Sắp xếp';

    return (
        <div className="relative inline-block">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium cursor-pointer hover:border-black focus:outline-none focus:border-black transition-colors"
            >
                {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={16} />
            </div>
        </div>
    );
}
