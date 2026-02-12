import BannerCarousel from '@/components/home/BannerCarousel'
import FlashSaleBanner from '@/components/flash-sales/FlashSaleBanner'
import HeroSection from '@/components/home/HeroSection'
import FeaturedSection from '@/components/home/FeaturedSection'
import ClassicsCarousel from '@/components/home/ClassicsCarousel'
import CategoriesSection from '@/components/home/CategoriesSection'
import LinksSection from '@/components/home/LinksSection'

export default function Home() {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BannerCarousel />
      </div>
      <FlashSaleBanner />
      <div className="mt-8">
        <FeaturedSection />
      </div>
      <ClassicsCarousel />
      <CategoriesSection />
      <LinksSection />
    </div>
  )
}
