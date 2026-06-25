'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      async function fetchOrders() {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id) // صرف اسی یوزر کے آرڈرز لائیں
          .order('created_at', { ascending: false });
        
        if (data) setOrders(data);
        setLoading(false);
      }
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  // اگر یوزر لاگ ان نہیں ہے
  if (!user) {
    return (
      <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-stone-800">Please login to view your orders</h2>
        <Link href="/auth" className="mt-4 bg-red-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-red-700">Login</Link>
      </div>
    );
  }

  // اگر لوڈ ہو رہا ہو
  if (loading) {
    return <div className="min-h-screen bg-amber-50/50 flex items-center justify-center"><p>Loading orders...</p></div>;
  }

  return (
    <div className="min-h-screen bg-amber-50/50 py-12">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
            <p className="text-stone-600 mb-4">You have no orders yet.</p>
            <Link href="/" className="text-red-600 font-semibold hover:underline">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-stone-800">Order ID: {order.id.substring(0, 8)}</h3>
                    <p className="text-xs text-stone-500">Placed on: {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  {/* یہاں آرڈر کی صورتحال (Status) دکھائی جا رہی ہے */}
                  <span className={`text-sm font-semibold px-4 py-2 rounded-full 
                    ${order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                      order.status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'}`}
                  >
                    {order.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-stone-600">{item.quantity}x {item.name}</span>
                      <span className="text-stone-800 font-medium">Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t mt-4 pt-4 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-red-700">Rs. {order.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
