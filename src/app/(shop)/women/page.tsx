'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface HeroSlide {
  id: number
  image: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  bgColor?: string
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=1200&q=80",
    title: "Bộ Sưu Tập Nữ",
    subtitle: "Khám phá những thiết kế thể thao và thời trang mới nhất dành cho phụ nữ",
    ctaText: "Mua Ngay",
    ctaLink: "/categories?gender=women&category=clothing"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80",
    title: "Essentials Nữ",
    subtitle: "Phong cách cho mọi buổi tập luyện",
    ctaText: "Khám Phá",
    ctaLink: "/categories?category=essentials"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80",
    title: "Bộ Sưu Tập Yoga",
    subtitle: "Thoải mái trong từng động tác",
    ctaText: "Xem Thêm",
    ctaLink: "/categories?sport=yoga"
  }
]

import { useLanguage } from '@/contexts/LanguageContext';

export default function WomenPage() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0)

  // ... useEffects and handlers ...

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div>
      {/* Women's Hero Carousel */}
      <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${index === currentSlide ? 'translate-x-0' :
              index < currentSlide ? '-translate-x-full' : 'translate-x-full'
              }`}
          >
            <div className="relative h-full w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-2xl px-6">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-8 font-light">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.ctaLink}
                    className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full transition-colors z-10"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full transition-colors z-10"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.hub.womens_title} {t.filters.category}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
                alt="Giày thể thao nữ"
                width={400}
                height={300}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">{t.hub.shop_shoes}</h3>
                <p className="text-sm opacity-90">{t.hub.womens_desc}</p>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80"
                alt="Quần áo thể thao nữ"
                width={400}
                height={300}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">{t.hub.shop_clothing}</h3>
                <p className="text-sm opacity-90">{t.hub.womens_desc}</p>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                alt="Phụ kiện thể thao nữ"
                width={400}
                height={300}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">{t.filters.category}</h3>
                <p className="text-sm opacity-90">{t.hub.womens_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Women's Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-8">{t.hub.featured_collections}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative">
            <div className="relative h-[500px] w-full overflow-hidden bg-gray-100 rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
                alt="Women's Essentials"
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Essentials Nữ</h3>
              <p className="mb-4 text-gray-600">Phong cách cho mọi buổi tập luyện</p>
              <Link
                href="/categories?gender=women&category=lifestyle"
                className="inline-block bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                {t.home.shop_now}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[500px] w-full overflow-hidden bg-gray-100 rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80"
                alt="Yoga Collection"
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Bộ Sưu Tập Yoga</h3>
              <p className="mb-4 text-gray-600">Thoải mái trong từng động tác</p>
              <Link
                href="/categories?gender=women&sport=training"
                className="inline-block bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                {t.home.shop_now}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Style By Women Athletes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-8">{t.hub.style_by_athletes}</h2>

        {/* ... keeping athletes grid as is but replacing generic buttons ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative group">
            <div className="relative h-[400px] w-full overflow-hidden bg-gray-100 rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
                alt="Naomi Osaka's Signature Style"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Phong Cách Đặc Trưng<br />Của Naomi Osaka</h3>
              <div className="mt-4">
                <button className="border border-black rounded-full text-sm px-4 py-1.5 hover:bg-black hover:text-white transition-colors">
                  {t.hub.shop_collection}
                </button>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="relative h-[400px] w-full overflow-hidden bg-gray-100 rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800&q=80"
                alt="Serena Williams Collection"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Bộ Sưu Tập<br />Serena Williams</h3>
              <div className="mt-4">
                <button className="border border-black rounded-full text-sm px-4 py-1.5 hover:bg-black hover:text-white transition-colors">
                  {t.hub.shop_collection}
                </button>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="relative h-[400px] w-full overflow-hidden bg-gray-100 rounded-lg">
              <Image
                src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"
                alt="Alex Morgan's Game Day Style"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Phong Cách Thi Đấu<br />Của Alex Morgan</h3>
              <div className="mt-4">
                <button className="border border-black rounded-full text-sm px-4 py-1.5 hover:bg-black hover:text-white transition-colors">
                  {t.hub.shop_collection}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


