'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/app/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [transactionId, setTransactionId] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    }
    fetchSettings();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('orders').insert([
      {
        user_id: user?.id,
        customer_name: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address,
        items: cart,
        total_amount: totalAmount,
        status: 'Pending',
        location_link: locationLink || null,
        payment_method: paymentMethod,
        transaction_id: transactionId || null
      }
    ]);

    if (!error) {
      clearCart();
      router.push('/thank-you');
    } else {
      alert('Error placing order: ' + error.message);
    }
    setLoading(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-stone-800">Your cart is empty</h2>
        <a href="/" className="mt-4 text-red-600 font-semibold hover:underline">Go back to shopping</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] py-12">
      <div className="container mx-auto px-4 md:px-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold mb-4">Your Items</h2>
            {cart.map((item: any) => (
              <div key={item._id} className="flex items-center gap-4 border-b py-4">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-grow">
                  <h4 className="font-semibold text-stone-800">{item.name}</h4>
                  <p className="text-red-600 font-bold">Rs. {item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="bg-stone-200 w-8 h-8 rounded-full font-bold">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="bg-stone-200 w-8 h-8 rounded-full font-bold">+</button>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="text-red-500 ml-4">X</button>
              </div>
            ))}
            <div className="mt-4 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-red-700">Rs. {totalAmount}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold mb-4">Delivery & Payment</h2>
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label><input type="text" required value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label><input type="tel" required value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Address</label><textarea required rows={3} value={customerInfo.address} onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900"></textarea></div>

              {/* واٹس ایپ جیسا لوکیشن لِنک والا سسٹم */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Google Maps Location Link</label>
                <input 
                  type="url" 
                  required 
                  value={locationLink} 
                  onChange={(e) => setLocationLink(e.target.value)} 
                  className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" 
                  placeholder="Paste your location link here" 
                />
                <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  📍 Click here to open Google Maps, select your location, copy the link and paste above.
                </a>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setPaymentMethod('COD')} className={`cursor-pointer p-3 border-2 rounded-xl font-semibold text-sm ${paymentMethod === 'COD' ? 'border-red-600 bg-red-50 text-red-700' : 'border-stone-200 text-stone-600'}`}>💵 COD</button>
                  <button type="button" onClick={() => setPaymentMethod('Easypaisa')} className={`cursor-pointer p-3 border-2 rounded-xl font-semibold text-sm ${paymentMethod === 'Easypaisa' ? 'border-green-600 bg-green-50 text-green-700' : 'border-stone-200 text-stone-600'}`}>📱 Easypaisa</button>
                  <button type="button" onClick={() => setPaymentMethod('JazzCash')} className={`cursor-pointer p-3 border-2 rounded-xl font-semibold text-sm ${paymentMethod === 'JazzCash' ? 'border-red-600 bg-red-50 text-red-700' : 'border-stone-200 text-stone-600'}`}>📶 JazzCash</button>
                </div>
              </div>

              {paymentMethod !== 'COD' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
                  Please send Rs. {totalAmount} to our {paymentMethod} number: <span className="font-bold">{paymentMethod === 'Easypaisa' ? settings.easypaisa_number : settings.jazzcash_number}</span>. 
                  <br/>Enter your Transaction ID (TID) below:
                  <input type="text" required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full mt-2 p-2 border border-stone-300 rounded-lg text-stone-900" placeholder="e.g. 123456789" />
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer active:scale-95 transition">
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
