'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'

import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection = () => {
  const { t, language } = useLanguage();
  // State to track if the component is mounted (client-side only)
  const [isMounted, setIsMounted] = useState(false);

  // Run once after component mounts on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fontClass = language === 'vi' ? 'font-bold' : 'font-nike-futura';

  return (

    <section className="relative w-full">
      {/* Video/image container */}

      <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden bg-black">
        {/* Only render image on client-side to avoid hydration errors */}
        {isMounted && (
          <Image
            src="https://ext.same-assets.com/3155489436/512266164.jpeg"
            alt="Sophia Smith - Nike athlete"
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Play button overlay */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="flex items-center space-x-2">
            <button className="bg-black/40 backdrop-blur-sm h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
              <Play className="h-5 w-5 text-white" />
            </button>
            <span className="text-xs text-white font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-sm">0:15</span>
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="nike-container py-8 md:py-12 flex flex-col items-center">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-helvetica-medium mb-2">Sophia Smith</p>
          <h1 className={`text-5xl md:text-6xl ${fontClass} uppercase tracking-tighter mb-4`}>
            {t.home.hero_title}
          </h1>
          <p className="text-sm md:text-base font-helvetica mb-6">
            {t.home.hero_subtitle}
          </p>
          <Link href="/collection/sophia-smith">
            <Button className="rounded-full px-6 py-6 text-base">
              {t.home.shop_now}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
