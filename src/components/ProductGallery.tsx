'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
    images: string[];
    name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
    const [activeImage, setActiveImage] = useState(images[0]);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 rounded-2xl">
                <span className="text-4xl font-bold">{name.charAt(0)}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* 主图 */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 shadow-inner border border-gray-100">
                <Image
                    src={activeImage}
                    alt={name}
                    fill
                    className="object-cover transition-all duration-300"
                    priority
                />
            </div>

            {/* 缩略图列表 */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveImage(img)}
                            className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                activeImage === img 
                                    ? "border-blue-500 ring-2 ring-blue-100" 
                                    : "border-transparent hover:border-gray-300"
                            }`}
                        >
                            <Image
                                src={img}
                                alt={`${name} ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
