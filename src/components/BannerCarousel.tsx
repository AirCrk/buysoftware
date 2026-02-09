'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSlide {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    title?: string;
}

interface BannerCarouselProps {
    slides: BannerSlide[];
    autoPlayInterval?: number;
}

export default function BannerCarousel({ slides, autoPlayInterval = 5000 }: BannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // Auto play
    useEffect(() => {
        if (slides.length <= 1 || isHovered) return;

        const interval = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(interval);
    }, [slides.length, autoPlayInterval, nextSlide, isHovered]);

    if (slides.length === 0) {
        return null;
    }

    const handleClick = (slide: BannerSlide) => {
        if (slide.linkUrl) {
            window.open(slide.linkUrl, '_blank');
        }
    };

    return (
        <div
            className="relative w-full overflow-hidden rounded-xl bg-gray-100"
            style={{ aspectRatio: '4/1' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Slides */}
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div
                        key={slide.id}
                        className="w-full h-full flex-shrink-0 cursor-pointer"
                        onClick={() => handleClick(slide)}
                    >
                        <div className="relative w-full h-full">
                            <Image
                                src={slide.imageUrl}
                                alt={slide.title || 'Banner'}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1280px"
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevSlide();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                        style={{ opacity: isHovered ? 1 : 0 }}
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                        style={{ opacity: isHovered ? 1 : 0 }}
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                goToSlide(index);
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
