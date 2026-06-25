'use client';
import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';

export default function ProductCard({ product }: { product: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
        <div className="relative w-full h-32 md:h-40 bg-amber-50 flex items-center justify-center p-2">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-lg bg-red-600 px-4 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 flex flex-col flex-grow">
          {/* موبائل کے لیے ٹیکسٹ چھوٹا کیا گیا ہے */}
          <h3 className="font-bold text-sm md:text-lg text-stone-800">{product.name}</h3>
          <p className="text-xs md:text-sm text-stone-500 mt-1 flex-grow line-clamp-2">{product.description}</p>
          <div className="mt-3 md:mt-4 flex items-center justify-between">
            <span className="text-base md:text-xl font-extrabold text-red-700">Rs. {product.price}</span>
          </div>
          <div className="mt-3 md:mt-4 flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 py-1.5 md:py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-amber-900 bg-amber-100 rounded-xl hover:bg-amber-200 transition cursor-pointer"
            >
              Details
            </button>
            <button 
              disabled={!product.isAvailable}
              onClick={() => addToCart(product)}
              className="flex-1 py-1.5 md:py-2 px-2 md:px-4 text-xs md:text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-full h-64 bg-amber-50 flex items-center justify-center">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-stone-800">{product.name}</h2>
              <span className="inline-block mt-2 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">{product.category}</span>
              <p className="mt-4 text-stone-600">{product.description}</p>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-2xl font-extrabold text-red-700">Rs. {product.price}</span>
                <button 
                  onClick={() => { addToCart(product); setIsModalOpen(false); }}
                  className="py-3 px-6 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-md cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
