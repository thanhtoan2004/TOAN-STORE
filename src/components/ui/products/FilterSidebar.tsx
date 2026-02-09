"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

interface FilterOption {
    label: string;
    value: string;
    count?: number;
}

interface FilterSection {
    title: string;
    key: string;
    options: FilterOption[];
    type: 'checkbox' | 'radio';
}

interface FilterSidebarProps {
    onFilterChange: (filters: Record<string, string[]>) => void;
    activeFilters: Record<string, string[]>;
}

export default function FilterSidebar({ onFilterChange, activeFilters }: FilterSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>(['price', 'category']);

    const filterSections: FilterSection[] = [
        {
            title: 'Giá',
            key: 'price',
            type: 'radio',
            options: [
                { label: 'Dưới 1 triệu', value: '0-1000000' },
                { label: '1 - 2 triệu', value: '1000000-2000000' },
                { label: '2 - 3 triệu', value: '2000000-3000000' },
                { label: '3 - 5 triệu', value: '3000000-5000000' },
                { label: 'Trên 5 triệu', value: '5000000-999999999' },
            ]
        },
        {
            title: 'Danh mục',
            key: 'category',
            type: 'checkbox',
            options: [
                { label: 'Running', value: 'running' },
                { label: 'Basketball', value: 'basketball' },
                { label: 'Training', value: 'training' },
                { label: 'Lifestyle', value: 'lifestyle' },
                { label: 'Jordan', value: 'jordan' },
                { label: 'Football', value: 'football' },
            ]
        },
        {
            title: 'Kích cỡ',
            key: 'size',
            type: 'checkbox',
            options: [
                { label: '38', value: '38' },
                { label: '39', value: '39' },
                { label: '40', value: '40' },
                { label: '41', value: '41' },
                { label: '42', value: '42' },
                { label: '43', value: '43' },
                { label: '44', value: '44' },
                { label: '45', value: '45' },
            ]
        },
    ];

    const toggleSection = (key: string) => {
        setExpandedSections(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleFilterChange = (sectionKey: string, value: string, type: 'checkbox' | 'radio') => {
        const currentFilters = { ...activeFilters };

        if (type === 'radio') {
            // Radio: only one value per section
            currentFilters[sectionKey] = [value];
        } else {
            // Checkbox: multiple values
            if (!currentFilters[sectionKey]) {
                currentFilters[sectionKey] = [];
            }

            if (currentFilters[sectionKey].includes(value)) {
                currentFilters[sectionKey] = currentFilters[sectionKey].filter(v => v !== value);
                if (currentFilters[sectionKey].length === 0) {
                    delete currentFilters[sectionKey];
                }
            } else {
                currentFilters[sectionKey] = [...currentFilters[sectionKey], value];
            }
        }

        onFilterChange(currentFilters);
    };

    const clearAllFilters = () => {
        onFilterChange({});
    };

    const clearFilter = (sectionKey: string, value?: string) => {
        const currentFilters = { ...activeFilters };
        if (value) {
            currentFilters[sectionKey] = currentFilters[sectionKey].filter(v => v !== value);
            if (currentFilters[sectionKey].length === 0) {
                delete currentFilters[sectionKey];
            }
        } else {
            delete currentFilters[sectionKey];
        }
        onFilterChange(currentFilters);
    };

    const totalActiveFilters = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div className="w-full">
            {/* Active Filters */}
            {totalActiveFilters > 0 && (
                <div className="mb-6 pb-6 border-b">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">Bộ lọc đang áp dụng ({totalActiveFilters})</h3>
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-red-600 hover:text-red-700 underline"
                        >
                            Xóa tất cả
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(activeFilters).map(([key, values]) =>
                            values.map(value => {
                                const section = filterSections.find(s => s.key === key);
                                const option = section?.options.find(o => o.value === value);
                                return (
                                    <button
                                        key={`${key}-${value}`}
                                        onClick={() => clearFilter(key, value)}
                                        className="flex items-center gap-1 px-3 py-1 bg-black text-white text-xs rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        <span>{option?.label || value}</span>
                                        <X size={14} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Filter Sections */}
            {filterSections.map(section => (
                <div key={section.key} className="border-b pb-4 mb-4">
                    <button
                        onClick={() => toggleSection(section.key)}
                        className="flex items-center justify-between w-full py-2 text-left font-semibold hover:text-gray-600 transition-colors"
                    >
                        <span>{section.title}</span>
                        {expandedSections.includes(section.key) ? (
                            <ChevronUp size={20} />
                        ) : (
                            <ChevronDown size={20} />
                        )}
                    </button>

                    {expandedSections.includes(section.key) && (
                        <div className="mt-3 space-y-2">
                            {section.options.map(option => {
                                const isActive = activeFilters[section.key]?.includes(option.value);
                                return (
                                    <label
                                        key={option.value}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                    >
                                        <input
                                            type={section.type}
                                            name={section.key}
                                            value={option.value}
                                            checked={isActive}
                                            onChange={() => handleFilterChange(section.key, option.value, section.type)}
                                            className="w-4 h-4 accent-black cursor-pointer"
                                        />
                                        <span className="text-sm flex-1">{option.label}</span>
                                        {option.count !== undefined && (
                                            <span className="text-xs text-gray-500">({option.count})</span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
