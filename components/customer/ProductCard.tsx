'use client';
import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';

export default function ProductCard({ product }: { product: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  return (
    <>
      {/* موبائل پر 5 کے گرڈ کے لیے چھوٹا اور کمپیکٹ کارڈ */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-100 flex flex-col overflow-hidden h-full hover:shadow-md transition-shadow">
        
        <div className="relative w-full h-16 md:h-32 bg-amber-50 flex-shrink-0 cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover md:object-contain p-1" loading="lazy" />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-[8px] md:text-xs bg-red-600 px-1 rounded-full">Out</span>
            </div>
          )}
        </div>

        <div className="p-1 md:p-2 flex flex-col flex-grow">
          <h3 className="font-bold text-[8px] md:text-sm text-stone-800 truncate cursor-pointer" onClick={() => setIsModalOpen(true)}>{product.name}</h3>
          
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="text-[10px] md:text-base font-extrabold text-red-500">Rs.{product.price}</span>
          </div>
          
          <button 
            disabled={!product.isAvailable}
            onClick={() => addToCart(product)}
            className="mt-1 md:mt-2 w-full py-0.5 md:py-1.5 text-[8px] md:text-sm font-semibold text-white bg-red-500 rounded-md md:rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Add +
          </button>
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
                <span className="text-2xl font-extrabold text-red-500">Rs. {product.price}</span>
                <button 
                  onClick={() => { addToCart(product); setIsModalOpen(false); }}
                  className="py-3 px-6 font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition shadow-md cursor-pointer"
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
