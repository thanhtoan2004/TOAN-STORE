'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
            <button className="shop-button">
              {actionText}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}


//SẢN PHẨM NỔI BẬT
const FeaturedSection = () => {
  return (
    <section className="nike-container py-8 md:py-16">
      <h2 className="text-2xl font-nike-futura mb-8 text-center">SẢN PHẨM NỔI BẬT</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeaturedItem
          imageUrl="https://ext.same-assets.com/3155489436/3334072619.jpeg"
          title="Coming Soon"
          subtitle="Luka 4"
          actionText="Get Notified"
          actionLink="/products/luka-4"
        />

        <FeaturedItem
          imageUrl="https://ext.same-assets.com/3155489436/3598712307.jpeg"
          title="Style By Gabi Ruffels"
          subtitle="Subtlety's Not in the Lineup"
          actionText="Shop"
          actionLink="/style/gabi-ruffels"
        />

        <FeaturedItem
          imageUrl="https://ext.same-assets.com/3155489436/33375423.jpeg"
          title="Style By College Hoops' Best"
          subtitle="Dylan Harper's Winning Formula"
          actionText="Shop"
          actionLink="/style/dylan-harper"
        />

        <FeaturedItem
          imageUrl="https://ext.same-assets.com/3155489436/1929546920.jpeg"
          title="Max Cushioning For The Ultimate Ride"
          subtitle="Vomero 18"
          actionText="Shop"
          actionLink="/products/vomero-18"
        />
      </div>

      <div className="mt-12">
        <FeaturedItem
          imageUrl="https://ext.same-assets.com/3155489436/1895450608.jpeg"
          title="NIKE 24.7 COLLECTION"
          subtitle="Polished looks with a luxurious feel."
          actionText="Shop"
          actionLink="/collections/247"
          size="full"
        />
      </div>
    </section>
  )
}

export default FeaturedSection
