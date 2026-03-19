'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  image_url?: string;
  mobileImageUrl?: string;
  mobile_image_url?: string;
  linkUrl?: string;
  link_url?: string;
  linkText?: string;
  link_text?: string;
  position: string;
  displayOrder?: number;
  display_order?: number;
}

interface BannerCarouselProps {
  position?: string;
  autoPlay?: boolean;
  interval?: number;
}

import { useLanguage } from '@/contexts/LanguageContext';

export default function BannerCarousel({
  position = 'homepage',
  autoPlay = true,
  interval = 5000,
}: BannerCarouselProps) {
  const { t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [validBannerIds, setValidBannerIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadBanners();
  }, [position]);

  const loadBanners = async () => {
    try {
      const response = await fetch(`/api/banners?position=${position}&activeOnly=true`);
      const result = await response.json();

      if (result.success) {
        // Filter out banners with invalid image URLs
        const bannersWithValidImages = result.data.filter((banner: Banner) => {
          const imgUrl = banner.imageUrl || banner.image_url;
          if (!imgUrl) return false;

          // Basic URL validation - simpler check
          return imgUrl.length > 5;
        });

        setBanners(bannersWithValidImages);
        // Initialize all as valid
        setValidBannerIds(new Set(bannersWithValidImages.map((b: Banner) => b.id)));
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === banners.length - 1 ? 0 : prevIndex + 1));
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const trackBannerClick = async (bannerId: number) => {
    try {
      await fetch('/api/banners/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId }),
      });
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }
  };

  // Auto play
  useEffect(() => {
    if (!autoPlay || isPaused || banners.length <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, goToNext, banners.length]);

  if (loading) {
    return <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded-lg"></div>;
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full h-[500px] overflow-hidden rounded-lg group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banners */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <picture>
            {(banner.mobileImageUrl || banner.mobile_image_url) && (
              <source
                media="(max-width: 768px)"
                srcSet={banner.mobileImageUrl || banner.mobile_image_url}
              />
            )}
            <img
              src={banner.imageUrl || banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = banner.imageUrl || banner.image_url;
                console.error(`Failed to load image for banner "${banner.title}":`, img);
                // Remove from valid banners
                setValidBannerIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(banner.id);
                  return newSet;
                });
                // Hide failed image
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </picture>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
              <div className="max-w-xl text-white">
                <h2 className="text-5xl font-bold mb-4">{banner.title}</h2>
                {banner.description && (
                  <p className="text-xl mb-6 opacity-90">{banner.description}</p>
                )}
                {(banner.linkUrl || banner.link_url) && (
                  <Link
                    href={(banner.linkUrl || banner.link_url)!}
                    onClick={() => trackBannerClick(banner.id)}
                    className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                  >
                    {banner.linkText || banner.link_text || t.home.read_more}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
