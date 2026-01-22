'use client';

import React, { useState } from 'react';

interface ProductFilterProps {
  filterParams: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ filterParams, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    // If clicking the same value, unselect it
    if (filterParams[key] === value) {
      const newFilters = { ...filterParams };
      delete newFilters[key];
      onFilterChange(newFilters);
    } else {
      const newFilters = { ...filterParams, [key]: value };
      if (value === '' || value === 'all') {
        delete newFilters[key];
      }
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filterParams).length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Bộ Lọc</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-black underline"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Danh Mục</h4>
            {filterParams.category && (
              <button
                onClick={() => handleFilterChange('category', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filterParams.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Tất cả</span>
            </label>
            {['Lifestyle', 'Running', 'Basketball', 'Training', 'Skate'].map((category) => (
              <label key={category} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.toLowerCase()}
                  checked={filterParams.category === category.toLowerCase()}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sport Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Thể Thao</h4>
            {filterParams.sport && (
              <button
                onClick={() => handleFilterChange('sport', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="sport"
                value=""
                checked={!filterParams.sport}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Tất cả</span>
            </label>
            {['Running', 'Basketball', 'Training', 'Tennis', 'Golf'].map((sport) => (
              <label key={sport} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sport"
                  value={sport.toLowerCase()}
                  checked={filterParams.sport === sport.toLowerCase()}
                  onChange={(e) => handleFilterChange('sport', e.target.value)}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{sport}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Giá</h4>
            {filterParams.price && (
              <button
                onClick={() => handleFilterChange('price', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="price"
                value=""
                checked={!filterParams.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Tất cả</span>
            </label>
            {[
              { label: 'Dưới 1.000.000₫', value: 'under-1000000' },
              { label: '1.000.000₫ - 2.000.000₫', value: '1000000-2000000' },
              { label: '2.000.000₫ - 3.000.000₫', value: '2000000-3000000' },
              { label: 'Trên 3.000.000₫', value: 'over-3000000' },
            ].map((price) => (
              <label key={price.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  value={price.value}
                  checked={filterParams.price === price.value}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{price.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Giới Tính</h4>
            {filterParams.gender && (
              <button
                onClick={() => handleFilterChange('gender', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value=""
                checked={!filterParams.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Tất cả</span>
            </label>
            {['Men', 'Women', 'Kids'].map((gender) => (
              <label key={gender} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender.toLowerCase()}
                  checked={filterParams.gender === gender.toLowerCase()}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;

