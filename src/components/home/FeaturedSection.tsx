'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/Button"
import { useBanners } from '@/hooks/queries/useBanners';

import { useLanguage } from '@/contexts/LanguageContext';

interface FeaturedItemProps {
  imageUrl: string
  title: string
  subtitle: string
  actionText: string
  actionLink: string
  size?: 'full' | 'half'
}

const FeaturedItem = ({
  imageUrl,
  title,
  subtitle,
  actionText,
  actionLink,
  size = 'half'
}: FeaturedItemProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={`relative ${size === 'full' ? 'col-span-2' : ''}`}>
      <div className="relative h-[450px] w-full overflow-hidden">
        {isMounted && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700 ease-in-out"
          />
        )}
      </div>
      <div className="mt-4 px-2">
        {title && <h3 className="text-sm md:text-lg font-helvetica-medium">{title}</h3>}
        {subtitle && <p className="text-sm md:text-base mt-1">{subtitle}</p>}
        <div className="mt-4">
          <Link href={actionLink}>
            <Button className="rounded-full px-6 py-6 text-base">
              {actionText}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}


//SẢN PHẨM NỔI BẬT
//SẢN PHẨM NỔI BẬT
const FeaturedSection = () => {
  const { t, language } = useLanguage();
  const { data: featuredItems = [], isLoading: loading } = useBanners('home_featured', true);

  if (loading) return <div className="h-96 flex items-center justify-center">Loading...</div>;
  if (featuredItems.length === 0) return null; // Or keep hardcoded as fallback? Better to default to null or user content.

  // Helper to map banner to featured item
  const mapBannerToItem = (banner: any, size: 'full' | 'half' = 'half') => (
    <FeaturedItem
      key={banner.id}
      imageUrl={banner.image_url}
      title={banner.title}
      subtitle={banner.description}
      actionText={banner.link_text || t.home.shop_now}
      actionLink={banner.link_url || '#'}
      size={size}
    />
  );

  const fontClass = language === 'vi' ? 'font-bold' : 'font-toan-heading';

  return (
    <section className="toan-container py-8 md:py-16">
      <h2 className={`text-2xl ${fontClass} mb-8 text-center`}>{t.home.featured}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {featuredItems.slice(0, 4).map((item) => mapBannerToItem(item, 'half'))}
      </div>

      {featuredItems.length > 4 && (
        <div className="mt-12">
          {featuredItems.slice(4).map((item) => mapBannerToItem(item, 'full'))}
        </div>
      )}
    </section>
  )
}

export default FeaturedSection
