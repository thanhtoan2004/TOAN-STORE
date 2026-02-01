'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
  const [categories, setCategories] = useState([
    {
      title: 'Phụ kiện',
      imageUrl: 'https://ext.same-assets.com/3155489436/1731979930.jpeg',
      link: '/accessories'
    },
    {
      title: 'Giày dép',
      imageUrl: 'https://ext.same-assets.com/3155489436/3159598247.jpeg',
      link: '/shoes'
    },
    {
      title: 'Quần áo',
      imageUrl: 'https://ext.same-assets.com/3155489436/906736796.jpeg',
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
            imageUrl: cat.image_url || 'https://via.placeholder.com/400x600?text=No+Image', // Fallback
            link: `/categories/${cat.slug}` // Assumes category page structure
          }));
          setCategories(mappedCategories);
        }
      })
      .catch(console.error);
  }, [])

  return (
    <section className="nike-container py-10">
      <h2 className="text-2xl font-nike-futura mb-8 text-center">MUA SẮM THEO DOANH MỤC</h2>

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
