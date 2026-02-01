'use client';

import React, { useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';

interface ProductFilterProps {
  filterParams: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ filterParams, onFilterChange }) => {
  const { t } = useLanguage();
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
        <h3 className="text-lg font-semibold">{t.filters.title}</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-black underline"
          >
            {t.filters.clear_all}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">{t.filters.category}</h4>
            {filterParams.category && (
              <button
                onClick={() => handleFilterChange('category', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                {t.filters.clear}
              </button>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filterParams.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.filters.all}</span>
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
                <span className="text-sm text-gray-700">{t.filters[category.toLowerCase() as keyof typeof t.filters] || category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sport Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">{t.filters.sport}</h4>
            {filterParams.sport && (
              <button
                onClick={() => handleFilterChange('sport', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                {t.filters.clear}
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
              <span className="text-sm text-gray-700">{t.filters.all}</span>
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
                <span className="text-sm text-gray-700">{t.filters[sport.toLowerCase() as keyof typeof t.filters] || sport}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">{t.filters.price}</h4>
            {filterParams.price && (
              <button
                onClick={() => handleFilterChange('price', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                {t.filters.clear}
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
              <span className="text-sm text-gray-700">{t.filters.all}</span>
            </label>
            {[
              { label: t.filters.under_1m, value: 'under-1000000' },
              { label: t.filters.from_1m_to_2m, value: '1000000-2000000' },
              { label: t.filters.from_2m_to_3m, value: '2000000-3000000' },
              { label: t.filters.over_3m, value: 'over-3000000' },
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
            <h4 className="font-medium text-sm">{t.filters.gender}</h4>
            {filterParams.gender && (
              <button
                onClick={() => handleFilterChange('gender', '')}
                className="text-xs text-gray-500 hover:text-black underline"
              >
                {t.filters.clear}
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
              <span className="text-sm text-gray-700">{t.filters.all}</span>
            </label>
            {[
              { label: t.nav.men, value: 'men' },
              { label: t.nav.women, value: 'women' },
              { label: t.nav.kids, value: 'kids' }
            ].map((gender) => (
              <label key={gender.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender.value}
                  checked={filterParams.gender === gender.value}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">{gender.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;

