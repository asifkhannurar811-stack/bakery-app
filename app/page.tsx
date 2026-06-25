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
  
  const [settings, setSettings] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data);
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
    <main className="bg-orange-50 min-h-screen">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-extrabold text-orange-600">Fooma Bakery</h1>
        
        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative bg-orange-100 text-orange-900 font-semibold py-2 px-4 rounded-full hover:bg-orange-200 cursor-pointer">
            🛒 Cart
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cart.length}
              </span>
            )}
          </Link>

          {user && (
            <Link href="/orders" className="bg-blue-100 text-blue-900 font-semibold py-2 px-4 rounded-full hover:bg-blue-200 hidden sm:block cursor-pointer">
              My Orders
            </Link>
          )}

          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="bg-stone-800 text-white font-semibold py-2 px-6 rounded-full hover:bg-stone-700 cursor-pointer">
              Logout
            </button>
          ) : (
            <Link href="/auth" className="bg-red-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-red-700 cursor-pointer">
              Login / Sign Up
            </Link>
          )}
        </div>
      </header>

      {/* پروفیشنل سلائیڈر سیکشن (اونچائی کم کر دی گئی ہے) */}
      <section className="relative w-full h-[220px] md:h-[320px] overflow-hidden shadow-md">
        <div 
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="relative w-full h-full flex-shrink-0">
              <img src={slide.img} alt="Food Offer" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 md:left-12 right-6 z-10 text-white max-w-xl">
                <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-3 uppercase tracking-wide">
                  Fooma Special
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight drop-shadow-lg">
                  {slide.offer}
                </h2>
                <button className="bg-white text-red-600 font-bold py-2 px-6 rounded-full shadow-lg hover:bg-orange-50 transition cursor-pointer text-sm">
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 right-6 md:right-12 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button 
              key={index} 
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all cursor-pointer ${currentSlide === index ? 'bg-white w-8' : 'bg-white/50 w-2'}`}
            />
          ))}
        </div>
      </section>

      {/* سرچ بار */}
      <section className="container mx-auto px-6 md:px-12 -mt-6 relative z-30">
        <div className="max-w-2xl mx-auto relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for cakes, shawarma, groceries..." 
            className="w-full py-4 px-6 pr-14 rounded-full text-stone-800 shadow-xl border border-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-400" 
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 p-3 rounded-full text-white cursor-pointer hover:bg-orange-600">🔍</button>
        </div>
      </section>

      {/* سروسز سیکشن */}
      <section className="bg-white py-8 mt-8 border-y border-stone-100">
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-full"><span className="text-2xl">🛵</span></div>
            <div><h3 className="font-bold text-stone-800">Quick Delivery</h3><p className="text-sm text-stone-500">Fast & safe delivery</p></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-full"><span className="text-2xl">🍽️</span></div>
            <div><h3 className="font-bold text-stone-800">Super Dine In</h3><p className="text-sm text-stone-500">Hygienic & comfortable</p></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-full"><span className="text-2xl">🛍️</span></div>
            <div><h3 className="font-bold text-stone-800">Easy Pick Up</h3><p className="text-sm text-stone-500">Grab your order easily</p></div>
          </div>
        </div>
      </section>

      {/* کیٹگریز */}
      <section className="sticky top-[65px] z-30 bg-orange-50/95 backdrop-blur-sm border-b border-stone-100 py-4">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`cursor-pointer whitespace-nowrap px-6 py-3 rounded-full font-semibold shadow-sm transition ${activeCategory === cat ? 'bg-red-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* پروڈکٹس */}
      <section className="container mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
            <p className="text-stone-500">No products found. Try searching something else.</p>
          )}
        </div>
      </section>
    </main>
  );
}
