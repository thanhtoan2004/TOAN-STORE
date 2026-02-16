'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

import { LinksSection } from '@/components/home';
import { Button } from "@/components/ui/Button";
import { Footprints, Shirt, Backpack, Dumbbell, Trophy, Timer } from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80",
  "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80"
];

const FEATURED_COLLECTIONS = [
  {
    id: 1,
    title: "Professional Essentials",
    subtitle: "Fly Off the Track",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80",
    link: "/categories?gender=men&sport=running",
    price: "From 1.500.000 ₫"
  },
  {
    id: 2,
    title: "Training",
    subtitle: "Fly On the Track",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    link: "/categories?gender=men&sport=training",
    price: "From 1.200.000 ₫"
  },
  {
    id: 3,
    title: "Basketball",
    subtitle: "Dominate the Court",
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80",
    link: "/categories?gender=men&sport=basketball",
    price: "From 2.500.000 ₫"
  },
  {
    id: 4,
    title: "Lifestyle",
    subtitle: "Everyday Comfort",
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
    link: "/categories?gender=men&category=lifestyle",
    price: "From 1.800.000 ₫"
  }
];

const ATHLETE_COLLECTIONS = [
  {
    id: 1,
    name: "Ace Bailey",
    title: "Comfort Zone",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    link: "/categories?category=lifestyle"
  },
  {
    id: 2,
    name: "Cade Cunningham",
    title: "Effortless Game",
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
    link: "/categories?sport=basketball"
  },
  {
    id: 3,
    name: "Dylan Harper",
    title: "Winning Formula",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    link: "/categories?sport=running"
  }
];

const CATEGORIES = [
  { name: "Shoes", icon: <Footprints className="w-8 h-8" />, link: "/categories?gender=men&category=shoes", count: "200+" },
  { name: "Clothing", icon: <Shirt className="w-8 h-8" />, link: "/categories?gender=men&category=clothing", count: "150+" },
  { name: "Accessories", icon: <Backpack className="w-8 h-8" />, link: "/categories?gender=men&category=accessories", count: "80+" },
  { name: "Training", icon: <Dumbbell className="w-8 h-8" />, link: "/categories?sport=training", count: "90+" },
  { name: "Basketball", icon: <Trophy className="w-8 h-8" />, link: "/categories?sport=basketball", count: "60+" },
  { name: "Running", icon: <Timer className="w-8 h-8" />, link: "/categories?sport=running", count: "75+" }
];

const CAROUSEL_INTERVAL = 5000;

// ============================================================================
// Types
// ============================================================================

interface Collection {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  price: string;
}

interface Athlete {
  id: number;
  name: string;
  title: string;
  image: string;
  link: string;
}

interface Category {
  name: string;
  icon: React.ReactNode;
  link: string;
  count: string;
}

// ============================================================================
// Components
// ============================================================================

interface HeroBannerProps {
  isMounted: boolean;
  currentImageIndex: number;
  onIndicatorClick: (index: number) => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  isMounted,
  currentImageIndex,
  onIndicatorClick
}) => {
  const { t } = useLanguage();
  return (
    <div className="relative w-full h-[500px] md:h-[600px]">
      {isMounted && (
        <div className="relative w-full h-full">
          {HERO_IMAGES.map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={`Men's Nike Collection ${index + 1}`}
              fill
              className={`object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              priority={index === 0}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6 bg-white/90 backdrop-blur-sm max-w-lg rounded-lg shadow-xl">
          <h1 className="text-5xl md:text-6xl font-bold uppercase mb-4 text-black">
            {t.hub.mens_title}
          </h1>
          <p className="font-helvetica mb-6 text-lg text-gray-700">
            {t.hub.mens_desc}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/men/clothing">
              <Button className="w-full sm:w-auto rounded-full" size="lg">
                {t.hub.shop_clothing}
              </Button>
            </Link>
            <Link href="/men/shoes">
              <Button className="w-full sm:w-auto rounded-full" size="lg">
                {t.hub.shop_shoes}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => onIndicatorClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  const { t } = useLanguage();
  return (
    <section className="nike-container py-16">
      <h2 className="text-3xl font-bold mb-8 text-center">
        {t.hub.shop_by_category}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link key={category.name} href={category.link}>
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-300 group">
              <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </div>
              <h3 className="font-helvetica-medium text-lg mb-1">
                {t.filters[category.name.toLowerCase() as keyof typeof t.filters] || category.name}
              </h3>
              <p className="text-sm text-gray-600">{category.count} items</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

interface FeaturedCollectionsProps {
  collections: Collection[];
  isMounted: boolean;
}

const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({
  collections,
  isMounted
}) => {
  const { t } = useLanguage();
  return (
    <section className="nike-container py-16">
      <h2 className="text-3xl font-bold mb-12 text-center">
        {t.hub.featured_collections}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {collections.map((collection) => (
          <div key={collection.id} className="group">
            <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
              {isMounted && (
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-helvetica mb-1">{collection.price}</p>
                <h3 className="text-lg font-helvetica-medium">{collection.title}</h3>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-4 text-gray-600">{collection.subtitle}</p>
              <Link href={collection.link}>
                <Button className="w-full rounded-full">
                  {t.hub.shop_collection}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

interface AthleteCardProps {
  athlete: Athlete;
  isMounted: boolean;
}

const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, isMounted }) => {
  return (
    <div className="relative group">
      <div className="relative h-[400px] w-full overflow-hidden">
        {isMounted && (
          <Image
            src={athlete.image}
            alt={`${athlete.name}'s ${athlete.title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-helvetica-medium">
          {athlete.name}'s<br />{athlete.title}
        </h3>
        <div className="mt-4">
          <Link href={athlete.link}>
            <Button variant="outline" className="rounded-full h-8 text-sm px-4 border-black hover:bg-black hover:text-white">
              Shop The Look
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

interface AthleteSectionProps {
  athletes: Athlete[];
  isMounted: boolean;
}

const AthleteSection: React.FC<AthleteSectionProps> = ({ athletes, isMounted }) => {
  const { t } = useLanguage();
  return (
    <section className="nike-container py-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-8">
        {t.hub.style_by_athletes}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {athletes.map((athlete) => (
          <AthleteCard
            key={athlete.id}
            athlete={athlete}
            isMounted={isMounted}
          />
        ))}
      </div>
    </section>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function MenPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleIndicatorClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div>
      <HeroBanner
        isMounted={isMounted}
        currentImageIndex={currentImageIndex}
        onIndicatorClick={handleIndicatorClick}
      />

      <CategoryGrid categories={CATEGORIES} />

      <FeaturedCollections
        collections={FEATURED_COLLECTIONS}
        isMounted={isMounted}
      />

      <AthleteSection
        athletes={ATHLETE_COLLECTIONS}
        isMounted={isMounted}
      />

      <LinksSection />
    </div>
  );
}


