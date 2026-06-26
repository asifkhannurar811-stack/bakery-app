'use client';
import { useState, useEffect } from 'react';
import ProductCard from '@/components/customer/ProductCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import Link from 'next/link';

const categories = ['All', 'Bakery', 'Fast Food', 'Desserts & Snacks', 'Beverages', 'General Store'];

export default function Home() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true); // لوڈنگ کا سسٹم
  
  const [settings, setSettings] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();

    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    }
    fetchSettings();

    const channel = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        setProducts((prev) => {
          if (payload.eventType === 'INSERT') return [payload.new, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map(p => p.id === payload.new.id ? payload.new : p);
          if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== payload.old.id);
          return prev;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
        if (payload.new) setSettings(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const slides = [
    { img: settings.hero_image_url, offer: settings.hero_offer_text },
    { img: settings.hero_image_url_2, offer: settings.hero_offer_text_2 },
    { img: settings.hero_image_url_3, offer: settings.hero_offer_text_3 }
  ].filter(slide => slide.img);

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="bg-stone-50 min-h-screen">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl md:text-2xl font-extrabold text-orange-500">Fooma Bakery</h1>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/cart" className="relative bg-orange-100 text-orange-900 font-semibold py-2 px-3 md:px-4 rounded-full hover:bg-orange-200 cursor-pointer text-sm md:text-base">
            🛒 Cart
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Link>

          {user && (
            <Link href="/orders" className="bg-blue-100 text-blue-900 font-semibold py-2 px-3 md:px-4 rounded-full hover:bg-blue-200 hidden sm:block cursor-pointer text-sm md:text-base">
              My Orders
            </Link>
          )}

          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="bg-stone-800 text-white font-semibold py-2 px-4 md:px-6 rounded-full hover:bg-stone-700 cursor-pointer text-sm md:text-base">
              Logout
            </button>
          ) : (
            <Link href="/auth" className="bg-red-500 text-white font-semibold py-2 px-4 md:px-6 rounded-full hover:bg-red-600 cursor-pointer text-sm md:text-base">
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section: بائیں ٹیکسٹ، دائیں تصویر */}
      <section className="bg-white py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4 md:px-12 flex flex-col md:flex-row items-center">
          
          {/* بائیں جانب ٹیکسٹ */}
          <div className="md:w-1/2 text-center md:text-left z-10 w-full order-2 md:order-1">
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">Tasty Food Tasty Life</h2>
            <div className="h-[80px] overflow-hidden relative">
              {slides.map((slide, index) => (
                <h1 key={index} className={`text-2xl md:text-4xl font-extrabold text-stone-800 mb-4 transition-all duration-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute top-0 left-0 right-0'}`}>
                  {slide.offer}
                </h1>
              ))}
            </div>
            <p className="text-stone-500 mb-6 max-w-md mx-auto md:mx-0 text-sm md:text-base">
              Freshly baked goods, savory snacks, and your daily groceries delivered to your doorstep.
            </p>
            <div className="max-w-md mx-auto md:mx-0 relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for cakes, shawarma..." 
                className="w-full py-3 px-5 pr-12 rounded-full text-stone-800 border border-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" 
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 p-2 rounded-full text-white cursor-pointer">🔍</button>
            </div>
          </div>
          
          {/* دائیں جانب تصویر (مکمل دکھنے والی) */}
          <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center relative w-full order-1 md:order-2 mb-4 md:mb-0">
            {slides.map((slide, index) => (
              <div key={index} className={`transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0 absolute'}`}>
                <img src={slide.img} alt="Food Offer" className="rounded-3xl w-full h-auto max-h-[400px] object-contain shadow-2xl" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-6 border-t border-stone-100">
        <div className="container mx-auto px-4 md:px-12 grid grid-cols-3 gap-2 md:gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-orange-100 p-3 rounded-full"><span className="text-xl md:text-2xl">🛵</span></div>
            <h3 className="font-bold text-xs md:text-base text-stone-800">Quick Delivery</h3>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-orange-100 p-3 rounded-full"><span className="text-xl md:text-2xl">🍽️</span></div>
            <h3 className="font-bold text-xs md:text-base text-stone-800">Super Dine In</h3>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-orange-100 p-3 rounded-full"><span className="text-xl md:text-2xl">🛍️</span></div>
            <h3 className="font-bold text-xs md:text-base text-stone-800">Easy Pick Up</h3>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4 md:px-12">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Favourites</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`cursor-pointer whitespace-nowrap px-5 py-2 rounded-full font-semibold shadow-sm transition text-sm ${activeCategory === cat ? 'bg-red-500 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid: موبائل پر 5 پروڈکٹس ایک رow میں */}
      <section className="container mx-auto px-4 md:px-12 pb-12">
        {loading ? (
          <p className="text-center text-stone-500 py-8">Loading products...</p>
        ) : (
          <div className="grid grid-cols-5 md:grid-cols-6 gap-2 md:gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={{
                  _id: product.id,
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  category: product.category,
                  imageUrl: product.image_url,
                  isAvailable: product.is_available
                }} />
              ))
            ) : (
              <p className="text-stone-500 text-center py-8 col-span-5">No products found.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
