'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryItemProps {
  title: string
  imageUrl: string
  link: string
}

const CategoryItem = ({ title, imageUrl, link }: CategoryItemProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setImgError(false);
  }, [imageUrl]);

  return (
    <Link href={link} className="group">
      <div className="relative h-[250px] w-full overflow-hidden bg-gray-100">
        {isMounted && !imgError ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>
      <h3 className="mt-3 text-base font-helvetica">{title}</h3>
    </Link>
  )
}

const CategoriesSection = () => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([
    {
      title: 'Phụ kiện',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      link: '/accessories'
    },
    {
      title: 'Giày dép',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      link: '/shoes'
    },
    {
      title: 'Quần áo',
      imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
      link: '/clothing'
    }
  ]);

  // Fetch categories from database
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const mappedCategories = data.data.map((cat: any) => ({
            title: cat.name,
            imageUrl: cat.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgNDAwIDYwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmMmYyZjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==', // Fallback SVG
            link: `/category/${cat.slug}` // Assumes category page structure
          }));
          setCategories(mappedCategories);
        }
      })
      .catch(console.error);
  }, [])

  const fontClass = language === 'vi' ? 'font-bold' : 'font-nike-futura';

  return (
    <section className="nike-container py-10">
      <h2 className={`text-2xl ${fontClass} mb-8 text-center uppercase`}>{t.hub.shop_by_category || 'MUA SẮM THEO DANH MỤC'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <CategoryItem
            key={index}
            title={category.title}
            imageUrl={category.imageUrl}
            link={category.link}
          />
        ))}
      </div>
    </section>
  )
}

export default CategoriesSection
