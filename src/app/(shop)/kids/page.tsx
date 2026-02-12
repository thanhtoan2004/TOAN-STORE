'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

import { LinksSection } from '@/components/home';
import { Button } from "@/components/ui/Button";
import { Footprints, Shirt, Backpack, Baby, School, Trophy } from 'lucide-react';

const HERO_IMAGES = [
    "https://ext.same-assets.com/3155489436/3889410111.jpeg",
    "https://ext.same-assets.com/3155489436/2791647303.jpeg",
    "https://ext.same-assets.com/3155489436/366099981.jpeg"
];

const FEATURED_COLLECTIONS = [
    {
        id: 1,
        title: "Back to School",
        subtitle: "Gear up for learning",
        image: "https://ext.same-assets.com/3155489436/3889410111.jpeg",
        link: "/categories?gender=kids&category=lifestyle",
        price: "From 500.000 ₫"
    },
    {
        id: 2,
        title: "Sporty Kids",
        subtitle: "Ready for playground",
        image: "https://ext.same-assets.com/3155489436/2791647303.jpeg",
        link: "/categories?gender=kids&category=clothing",
        price: "From 350.000 ₫"
    },
    {
        id: 3,
        title: "Mini Jordan",
        subtitle: "Iconic style for little ones",
        image: "https://ext.same-assets.com/3155489436/366099981.jpeg",
        link: "/categories?brand=jordan&gender=kids",
        price: "From 1.200.000 ₫"
    },
    {
        id: 4,
        title: "Outdoor Play",
        subtitle: "Protection and comfort",
        image: "https://ext.same-assets.com/3155489436/2845474323.jpeg",
        link: "/categories?gender=kids&sport=running",
        price: "From 600.000 ₫"
    }
];

const CATEGORIES = [
    { name: "Giày", icon: <Footprints className="w-8 h-8" />, link: "/categories?gender=kids&category=shoes", count: "100+" },
    { name: "Quần áo", icon: <Shirt className="w-8 h-8" />, link: "/categories?gender=kids&category=clothing", count: "80+" },
    { name: "Phụ kiện", icon: <Backpack className="w-8 h-8" />, link: "/categories?gender=kids&category=accessories", count: "40+" },
    { name: "Trẻ nhỏ", icon: <Baby className="w-8 h-8" />, link: "/categories?gender=kids&age=baby", count: "30+" },
    { name: "Đi học", icon: <School className="w-8 h-8" />, link: "/categories?gender=kids&category=lifestyle", count: "50+" },
    { name: "Thể thao", icon: <Trophy className="w-8 h-8" />, link: "/categories?gender=kids&sport=running", count: "40+" }
];

export default function KidsPage() {
    const { t } = useLanguage();
    const [isMounted, setIsMounted] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white">
            {/* Hero Banner */}
            <div className="relative w-full h-[500px] md:h-[600px]">
                {isMounted && (
                    <div className="relative w-full h-full text-black">
                        {HERO_IMAGES.map((image, index) => (
                            <Image
                                key={index}
                                src={image}
                                alt={`Kids' Nike Collection ${index + 1}`}
                                fill
                                className={`object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                                priority={index === 0}
                            />
                        ))}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 bg-white/90 backdrop-blur-sm max-w-lg rounded-lg shadow-xl">
                        <h1 className="text-5xl md:text-6xl font-bold uppercase mb-4 text-black">
                            {t.hub.kids_title}
                        </h1>
                        <p className="font-helvetica mb-6 text-lg text-gray-700">
                            {t.hub.kids_desc}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/categories?gender=kids&category=clothing">
                                <Button className="w-full sm:w-auto rounded-full" size="lg">
                                    {t.hub.shop_clothing}
                                </Button>
                            </Link>
                            <Link href="/categories?gender=kids&category=shoes">
                                <Button className="w-full sm:w-auto rounded-full" size="lg">
                                    {t.hub.shop_shoes}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop by Category */}
            <section className="nike-container py-16">
                <h2 className="text-3xl font-bold mb-8 text-center">
                    {t.hub.shop_by_category}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {CATEGORIES.map((category) => (
                        <Link key={category.name} href={category.link}>
                            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-300 group">
                                <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300 text-black">
                                    {category.icon}
                                </div>
                                <h3 className="font-helvetica-medium text-lg mb-1 text-black">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-600">{category.count} items</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Collections */}
            <section className="nike-container py-16 border-t border-gray-100">
                <h2 className="text-3xl font-bold mb-12 text-center">
                    {t.hub.featured_collections}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {FEATURED_COLLECTIONS.map((collection) => (
                        <div key={collection.id} className="group">
                            <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
                                <Image
                                    src={collection.image}
                                    alt={collection.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <p className="text-sm font-helvetica mb-1">{collection.price}</p>
                                    <h3 className="text-lg font-helvetica-medium">{collection.title}</h3>
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="mb-4 text-gray-600 h-12 line-clamp-2">{collection.subtitle}</p>
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

            <LinksSection />
        </div>
    );
}
