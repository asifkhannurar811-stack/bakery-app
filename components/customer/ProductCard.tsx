'use client';
import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';

export default function ProductCard({ product }: { product: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  return (
    <>
      {/* کارڈ پر hover:-translate-y-1 سے یہ اوپر اٹھنے لگے گا */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col border border-stone-100 group">
        
        <div className="relative w-full h-36 md:h-48 bg-[#fcfcfb] overflow-hidden cursor-pointer p-2" onClick={() => setIsModalOpen(true)}>
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-xs md:text-sm bg-red-600 px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-sm md:text-base text-stone-800 line-clamp-1 cursor-pointer hover:text-orange-600 transition" onClick={() => setIsModalOpen(true)}>{product.name}</h3>
          <p className="text-xs text-stone-400 mt-0.5 flex-grow line-clamp-2">{product.description}</p>
          
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-base md:text-lg font-extrabold text-stone-900">Rs {product.price}</span>
          </div>
          
          <button disabled={!product.isAvailable} onClick={() => addToCart(product)} className="mt-3 w-full py-2 text-xs md:text-sm font-semibold text-white bg-stone-900 rounded-xl hover:bg-orange-600 active:scale-95 transition-all disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1">
            Add to Cart <span>+</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-64 bg-[#fcfcfb] p-4">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
              <button onClick={() => setIsModalOpen(false)} className="absolute top-3 left-3 bg-white p-2 rounded-full shadow-md cursor-pointer text-stone-600 hover:text-red-600 flex items-center gap-1 text-xs font-semibold">← Back</button>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md cursor-pointer text-stone-600 hover:text-red-600">✕</button>
            </div>
            <div className="p-6">
              <span className="inline-block text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full mb-3">{product.category}</span>
              <h2 className="text-2xl font-bold text-stone-900">{product.name}</h2>
              <p className="mt-2 text-stone-500 text-sm">{product.description}</p>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-2xl font-extrabold text-stone-900">Rs {product.price}</span>
                <button onClick={() => { addToCart(product); setIsModalOpen(false); }} className="py-3 px-8 font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 active:scale-95 transition-all shadow-md cursor-pointer">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
