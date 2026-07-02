'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RiderPanel() {
  const [isRider, setIsRider] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const RIDER_PASSWORD = 'rider123'; // رائیڈر کا پاس ورڈ

  const [orders, setOrders] = useState<any[]>([]);

  // پہلا useEffect: صرف لاگ اِن چیک کرنے کے لیے
  useEffect(() => {
    const auth = sessionStorage.getItem('isRiderAuth');
    if (auth === 'true') setIsRider(true);
  }, []);

  // دوسرا useEffect: جب رائیڈر لاگ اِن ہو جائے تو لائیو اپ ڈیٹس آن کریں
  useEffect(() => {
    if (isRider) {
      fetchRiderOrders();

      // لائیو اپ ڈیٹس: جب نیا آرڈر آئے یا پرانا اپ ڈیٹ ہو
      const channel = supabase
        .channel('rider-orders-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          // نیا آرڈر آئے تو فوراً لسٹ میں شامل کر دو
          setOrders((prev) => [payload.new, ...prev]);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
          // اگر ایڈمن سٹیٹس بدلے یا رائیڈر ڈلیوری مکمل کرے
          setOrders((prev) => prev.map((o) => o.id === payload.new.id ? payload.new : o));
          // اگر آرڈر ڈلیور ہو جائے تو وہ لسٹ سے ہٹ جائے گا کیونکہ ہم نیچے صرف Pending/Out for Delivery دیکھتے ہیں
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isRider]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === RIDER_PASSWORD) {
      setIsRider(true);
      sessionStorage.setItem('isRiderAuth', 'true');
    } else {
      alert('Wrong Rider Password!');
    }
  };

  const fetchRiderOrders = async () => {
    // صرف وہ آرڈرز لائیں جو ابھی ڈلیوری کے لیے باقی ہیں
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['Pending', 'Out for Delivery'])
      .order('created_at', { ascending: true });
    
    if (data) setOrders(data);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      alert('Error updating status: ' + error.message);
      fetchRiderOrders();
    }
  };

  // رائیڈر لاگ اِن سکرین
  if (!isRider) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">🛵 Rider Login</h2>
          <input 
            type="password" 
            required 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)} 
            className="w-full p-3 border border-stone-300 rounded-xl mb-4 text-stone-900" 
            placeholder="Enter Rider Password" 
          />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 cursor-pointer">
            Login
          </button>
        </form>
      </div>
    );
  }

  // رائیڈر ڈیش بورڈ
  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-extrabold text-stone-900">Delivery Dashboard</h1>
          <button onClick={() => { sessionStorage.removeItem('isRiderAuth'); setIsRider(false); }} className="bg-stone-800 text-white text-sm font-semibold py-2 px-4 rounded-full hover:bg-stone-900 cursor-pointer">
            Logout
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
            <p className="text-stone-500 text-lg">No deliveries assigned yet.</p>
            <p className="text-stone-400 text-sm mt-2">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 relative">
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg">{order.customer_name}</h3>
                    <p className="text-sm text-stone-500">Order ID: {order.id.substring(0, 8)}</p>
                    <p className="text-sm text-stone-500">Payment: <span className={`font-bold ${order.payment_method === 'COD' ? 'text-red-600' : 'text-green-600'}`}>{order.payment_method || 'COD'}</span></p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-stone-800 text-lg">Rs. {order.total_amount}</h3>
                    <p className="text-xs text-stone-400 mt-1">{new Date(order.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-bold text-stone-700 mb-2">Items to Deliver:</h4>
                  <ul className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 space-y-1">
                    {order.items?.map((item: any, index: number) => (
                      <li key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* کسٹمر کو کال کرنے کا بٹن */}
                  <a href={`tel:${order.phone}`} className="bg-green-500 text-white text-center font-bold py-3 rounded-xl hover:bg-green-600 transition cursor-pointer flex items-center justify-center gap-2">
                    📞 Call Customer
                  </a>

                  {/* گوگل میپ پر نیویگیٹ کرنے کا بٹن */}
                  {order.location_link ? (
                    <a href={order.location_link} target="_blank" rel="noreferrer" className="bg-blue-600 text-white text-center font-bold py-3 rounded-xl hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2">
                      📍 Navigate Map
                    </a>
                  ) : (
                    <button disabled className="bg-stone-300 text-stone-500 text-center font-bold py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                      📍 No Location
                    </button>
                  )}
                </div>

                <div className="mt-4 border-t pt-4">
                  <label className="block text-sm font-medium text-stone-700 mb-2">Update Order Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleStatusChange(order.id, 'Out for Delivery')} 
                      className={`py-2 rounded-xl font-semibold text-sm cursor-pointer transition ${order.status === 'Out for Delivery' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                    >
                      Out for Delivery
                    </button>
                    <button 
                      onClick={() => handleStatusChange(order.id, 'Delivered')} 
                      className={`py-2 rounded-xl font-semibold text-sm cursor-pointer transition ${order.status === 'Delivered' ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                    >
                      ✅ Mark Delivered
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}ø
