'use client';

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/Carousel"
import { useLanguage } from '@/contexts/LanguageContext';

interface ClassicProductProps {
  imageUrl: string
  name: string
  link: string
}

const ClassicProduct = ({ imageUrl, name, link }: ClassicProductProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Link href={link} className="flex flex-col items-center">
      <div className="relative h-[200px] w-[200px] bg-[#111] rounded-md overflow-hidden">
        {isMounted && (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-contain p-2"
          />
        )}
      </div>
      <p className="mt-3 text-sm font-helvetica text-center">{name}</p>
    </Link>
  )
}

const ClassicsCarousel = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Array<{
    id: number;
    name: string;
    imageUrl: string;
    link: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from database
    fetch('/api/products?limit=10')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products) {
          const formattedProducts = data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.image_url || 'https://via.placeholder.com/200',
            link: `/products/${p.id}`
          }));
          setProducts(formattedProducts);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  }, []);

  // Fallback static data if no products loaded
  const displayProducts = products.length > 0 ? products : [
    {
      id: 0,
      name: 'Air Max',
      imageUrl: 'https://static.nike.com/a/images/t_default/e6da41fa-1be4-4ce5-b89c-22be4f1c0a00/air-max-90-mens-shoes-6n3vKB.png',
      link: '/classics/air-max'
    },
    {
      id: 1,
      name: 'Blazer',
      imageUrl: 'https://static.nike.com/a/images/t_default/6c2a2cc3-95a0-4bd4-ab9c-3a58ce9f6258/blazer-mid-77-vintage-mens-shoes-nw30B2.png',
      link: '/classics/blazer'
    },
    {
      id: 2,
      name: 'Air Jordan 1',
      imageUrl: 'https://static.nike.com/a/images/t_default/2d76d1ee-b5fa-4513-a05a-7f079c7b0a9a/air-jordan-1-mid-mens-shoes-B3hV2G.png',
      link: '/classics/air-jordan-1'
    },
    {
      id: 3,
      name: 'Dunk',
      imageUrl: 'https://static.nike.com/a/images/t_default/6c2a2cc3-95a0-4bd4-ab9c-3a58ce9f6258/blazer-mid-77-vintage-mens-shoes-nw30B2.png',
      link: '/classics/dunk'
    },
    {
      id: 4,
      name: 'Air Force 1',
      imageUrl: 'https://static.nike.com/a/images/t_default/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-force-1-07-mens-shoes-5QFp5Z.png',
      link: '/classics/air-force-1'
    },
  ];

  const fontClass = language === 'vi' ? 'font-bold' : 'font-nike-futura';

  return (
    <section className="nike-container py-10">
      <div className="mb-8">
        <h2 className={`text-2xl ${fontClass} mb-2 uppercase`}>{t.common.product || 'SẢN PHẨM'}</h2>
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {displayProducts.map((product) => (
                <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/5">
                  <ClassicProduct
                    imageUrl={product.imageUrl}
                    name={product.name}
                    link={product.link}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      )}
    </section>
  )
}

export default ClassicsCarousel
