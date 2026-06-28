'use client';
import { useState, useEffect } from 'react';
import ProductCard from '@/components/customer/ProductCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import Link from 'next/link';

// کیٹگریز کو مختصر اور چھوٹا کر دیا گیا ہے
const categories = ['All', 'Bakery', 'Fast Food', 'General Store', 'Toys', 'Cold Drink', 'Energy Drink'];

export default function Home() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSignupPopup, setShowSignupPopup] = useState(false);

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

    if (!user) {
      const popupShown = sessionStorage.getItem('popupShown');
      if (!popupShown) {
        setShowSignupPopup(true);
        sessionStorage.setItem('popupShown', 'true');
      }
    }

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

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const slides = [
    { img: settings.hero_image_url, offer: settings.hero_offer_text },
    { img: settings.hero_image_url_2, offer: settings.hero_offer_text_2 },
    { img: settings.hero_image_url_3, offer: settings.hero_offer_text_3 }
  ].filter(slide => slide.img);

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 4000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="bg-[#f7f5f2] min-h-screen">
      <header className="bg-white shadow-sm py-3 px-4 md:px-8 sticky top-0 z-50 flex flex-col">
        <div className="flex justify-between items-center w-full">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍰</span>
            <h1 className="text-xl md:text-2xl font-extrabold text-orange-600">Fooma</h1>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/cart" className="relative bg-orange-50 text-orange-900 py-2 px-3 rounded-full hover:bg-orange-100 cursor-pointer transition flex items-center gap-1 text-sm font-semibold">
              <span>🛒</span> <span>Cart</span>
              {cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{cart.length}</span>)}
            </Link>

            {user && (
              <Link href="/orders" className="bg-blue-50 text-blue-900 py-2 px-3 rounded-full hover:bg-blue-100 cursor-pointer transition text-sm font-semibold flex items-center gap-1">
                <span>📦</span> <span>Orders</span>
              </Link>
            )}

            {user ? (
              <button onClick={() => supabase.auth.signOut()} className="bg-stone-800 text-white font-semibold py-2 px-4 md:px-6 rounded-full hover:bg-stone-900 cursor-pointer transition text-xs md:text-sm">Logout</button>
            ) : (
              <Link href="/auth" className="bg-red-600 text-white font-semibold py-2 px-4 md:px-6 rounded-full hover:bg-red-700 cursor-pointer transition text-xs md:text-sm">Login</Link>
            )}
          </div>
        </div>
        
        {settings.delivery_start_time && (
          <div className="text-center text-xs text-stone-500 mt-2 border-t pt-2">
            🛵 Delivery Available: <span className="font-bold text-stone-800">{settings.delivery_start_time}</span> to <span className="font-bold text-stone-800">{settings.delivery_end_time}</span>
          </div>
        )}
      </header>

      <section className="bg-white py-6 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-2 gap-4 items-center">
          <div className="text-left z-10">
            <span className="inline-block bg-orange-100 text-orange-700 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wide">Tasty Food</span>
            <div className="h-[50px] md:h-[80px] overflow-hidden relative">
              {slides.map((slide, index) => (
                <h1 key={index} className={`text-xl md:text-4xl font-extrabold text-stone-900 transition-all duration-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute top-0 left-0 right-0'}`}>{slide.offer}</h1>
              ))}
            </div>
            <p className="hidden md:block text-stone-500 mb-4 text-sm">Freshly baked goods delivered fast.</p>
            <div className="relative mt-2 md:mt-4">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full py-2 md:py-3 px-3 md:px-5 pr-10 md:pr-14 rounded-full text-stone-800 border border-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs md:text-sm" />
              <button className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-orange-500 p-1.5 md:p-2.5 rounded-full text-white cursor-pointer hover:bg-orange-600 transition text-xs">🔍</button>
            </div>
          </div>
          
          <div className="flex justify-center relative w-full h-36 md:h-80">
            {slides.map((slide, index) => (
              <div key={index} className={`transition-opacity duration-700 absolute inset-0 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                <img src={slide.img} alt="Food Offer" className="w-full h-full object-contain rounded-2xl md:rounded-3xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* کیٹگریز والا حصہ (موبائل پر چھوٹا اور کمپیکٹ) */}
      <section className="sticky top-[60px] z-40 bg-[#f7f5f2] py-3 border-b border-stone-200/50 shadow-sm">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`cursor-pointer whitespace-nowrap px-3 md:px-5 py-1.5 md:py-2.5 rounded-full font-medium shadow-sm transition text-xs md:text-sm ${activeCategory === cat ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-200'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-8">
        <h2 className="text-lg md:text-xl font-bold text-stone-800 mb-4">{activeCategory === 'All' ? 'All Products' : activeCategory}</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1,2,3,4,5,6].map(i => (<div key={i} className="bg-white rounded-2xl h-64 animate-pulse"></div>))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product: any) => (<ProductCard key={product.id} product={{ _id: product.id, name: product.name, description: product.description, price: product.price, category: product.category, imageUrl: product.image_url, isAvailable: product.is_available }} />))
            ) : (<p className="text-stone-500 text-center py-8 col-span-full">No products found.</p>)}
          </div>
        )}
      </section>

      {showSignupPopup && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-stone-800 mb-2">Welcome to Fooma! 🍰</h3>
            <p className="text-stone-500 text-sm mb-6">Sign up with your email to get fresh bakery items delivered to your doorstep.</p>
            <div className="flex flex-col gap-3">
              <Link href="/auth" className="bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition" onClick={() => setShowSignupPopup(false)}>Sign Up Now</Link>
              <button onClick={() => setShowSignupPopup(false)} className="text-stone-400 text-sm hover:text-stone-700 cursor-pointer">Maybe Later</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
