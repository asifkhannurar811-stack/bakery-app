'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const ADMIN_PASSWORD = 'bakery123'; 

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Bakery', description: '', imageUrl: '' });
  const [bulkJson, setBulkJson] = useState('');
  
  const [settingsForm, setSettingsForm] = useState<any>({ 
    hero_image_url: '', hero_offer_text: '', 
    hero_image_url_2: '', hero_offer_text_2: '',
    hero_image_url_3: '', hero_offer_text_3: '',
    jazzcash_number: '', easypaisa_number: '',
    delivery_start_time: '', delivery_end_time: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('isAdminAuth');
    if (auth === 'true') setIsAdmin(true);

    fetchOrders();
    fetchSettings();
    fetchAdminProducts();

    const channel = supabase
      .channel('admin-realtime-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prevOrders) => [payload.new, ...prevOrders]);
        setNewOrderIds((prev) => [...prev, payload.new.id]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAdminProducts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem('isAdminAuth', 'true');
    } else { alert('Wrong Password!'); }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchAdminProducts = async () => {
    // یہاں سے order('created_at') ہٹا دیا گیا ہے تاکہ پروڈکٹس دیکھائی دیں
    const { data } = await supabase.from('products').select('*');
    if (data) setAdminProducts(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (data) setSettingsForm(data);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    setNewOrderIds((prev) => prev.filter(id => id !== orderId));
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { alert('Error updating status: ' + error.message); fetchOrders(); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) { alert('Product deleted successfully!'); fetchAdminProducts(); }
      else { alert('Error: ' + error.message); }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([
      { name: productForm.name, price: parseFloat(productForm.price), category: productForm.category, description: productForm.description, image_url: productForm.imageUrl, is_available: true }
    ]);
    if (!error) { alert('Product added successfully!'); setProductForm({ name: '', price: '', category: 'Bakery', description: '', imageUrl: '' }); }
    else { alert('Error: ' + error.message); }
  };

  const handleBulkAdd = async () => {
    try {
      const items = JSON.parse(bulkJson);
      const formattedItems = items.map((item: any) => ({ name: item.name, price: parseFloat(item.price), category: item.category, description: item.description, image_url: item.imageUrl, is_available: true }));
      const { error } = await supabase.from('products').insert(formattedItems);
      if (!error) { alert(`${items.length} products added successfully!`); setBulkJson(''); } 
      else { alert('Error: ' + error.message); }
    } catch (err) { alert('Invalid JSON format.'); }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSettings(true);
    const { error } = await supabase.from('settings').update({
      hero_image_url: settingsForm.hero_image_url, hero_offer_text: settingsForm.hero_offer_text,
      hero_image_url_2: settingsForm.hero_image_url_2, hero_offer_text_2: settingsForm.hero_offer_text_2,
      hero_image_url_3: settingsForm.hero_image_url_3, hero_offer_text_3: settingsForm.hero_offer_text_3,
      jazzcash_number: settingsForm.jazzcash_number, easypaisa_number: settingsForm.easypaisa_number,
      delivery_start_time: settingsForm.delivery_start_time, delivery_end_time: settingsForm.delivery_end_time
    }).eq('id', 1);

    if (!error) alert('Settings updated successfully!');
    else alert('Error: ' + error.message);
    setLoadingSettings(false);
  };

  const slideFields = [
    { urlKey: 'hero_image_url', offerKey: 'hero_offer_text', num: 1 },
    { urlKey: 'hero_image_url_2', offerKey: 'hero_offer_text_2', num: 2 },
    { urlKey: 'hero_image_url_3', offerKey: 'hero_offer_text_3', num: 3 }
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">Admin Login</h2>
          <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-3 border border-stone-300 rounded-xl mb-4 text-stone-900" placeholder="Enter Admin Password" />
          <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 cursor-pointer">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-64 bg-stone-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold text-amber-400 mb-8">Bakery Admin</h2>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab('orders')} className={`cursor-pointer block w-full text-left py-2 px-4 rounded-lg ${activeTab === 'orders' ? 'bg-amber-500 text-stone-900' : 'hover:bg-stone-800'}`}>📦 Orders Management</button>
          <button onClick={() => setActiveTab('products')} className={`cursor-pointer block w-full text-left py-2 px-4 rounded-lg ${activeTab === 'products' ? 'bg-amber-500 text-stone-900' : 'hover:bg-stone-800'}`}>🍰 Product Management</button>
          <button onClick={() => setActiveTab('settings')} className={`cursor-pointer block w-full text-left py-2 px-4 rounded-lg ${activeTab === 'settings' ? 'bg-amber-500 text-stone-900' : 'hover:bg-stone-800'}`}>⚙️ Website Settings</button>
          <button onClick={() => { sessionStorage.removeItem('isAdminAuth'); setIsAdmin(false); }} className="cursor-pointer block w-full text-left py-2 px-4 rounded-lg text-red-400 hover:bg-stone-800 mt-10">🚪 Logout</button>
        </nav>
      </aside>

      <main className="flex-grow p-4 md:p-8">
        {activeTab === 'orders' ? (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Customer Orders (Live)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Order ID</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Customer</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Items Ordered</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Total</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Payment</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">TID</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Status</th>
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Location Link</th> 
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className={`border-b border-stone-100 hover:bg-stone-50 align-top ${newOrderIds.includes(order.id) ? 'bg-green-50' : ''}`}>
                      <td className="py-4 px-4 text-xs font-medium text-stone-800">
                        {order.id.substring(0, 8)}
                        {newOrderIds.includes(order.id) && (
                          <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-stone-800">{order.customer_name}</p>
                        <p className="text-xs text-stone-500">{order.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-stone-600">
                        <ul className="list-disc list-inside">
                          {order.items?.map((item: any, index: number) => (<li key={index}>{item.quantity}x {item.name} <span className="text-stone-400">(Rs. {item.price})</span></li>))}
                        </ul>
                        <p className="text-xs text-stone-400 mt-1">{order.address}</p>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-stone-800">Rs. {order.total_amount}</td>
                      <td className="py-4 px-4"><span className={`text-xs px-3 py-1 rounded-full font-bold ${order.payment_method === 'COD' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{order.payment_method || 'COD'}</span></td>
                      <td className="py-4 px-4 text-xs font-mono text-stone-700">{order.transaction_id ? order.transaction_id : '-'}</td>
                      <td className="py-4 px-4">
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="text-xs border border-stone-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white cursor-pointer text-stone-900">
                          <option>Pending</option><option>Preparing</option><option>Out for Delivery</option><option>Delivered</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        {order.location_link ? (
                          <a href={order.location_link} target="_blank" rel="noreferrer" className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-700 inline-block cursor-pointer">View Map 📍</a>
                        ) : ( <span className="text-xs text-stone-400">No Link</span> )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p className="text-center text-stone-500 py-8">No orders yet.</p>}
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-6">Add New Product</h2>
              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Product Name</label><input type="text" required value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="e.g. Chocolate Fudge Cake" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Price (Rs.)</label><input type="number" required value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="e.g. 1500" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl bg-white cursor-pointer text-stone-900">
                    <option>Bakery</option><option>Fast Food</option><option>General Store</option><option>Toys</option><option>Cold Drink</option><option>Energy Drink</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Image URL</label><input type="url" required value={productForm.imageUrl} onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="https://..." /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-stone-700 mb-1">Description</label><textarea required rows={4} value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="Describe the product..."></textarea></div>
                <div className="md:col-span-2"><button type="submit" className="cursor-pointer bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700">Save Product</button></div>
              </form>
            </div>

            {/* موجودہ پروڈکٹس کی لسٹ اور ڈیلیٹ والا بٹن */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-4">Existing Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {adminProducts.map((p: any) => (
                  <div key={p.id} className="border rounded-xl p-3 flex flex-col items-center text-center relative">
                    <button 
                      onClick={() => handleDeleteProduct(p.id)} 
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-700 cursor-pointer text-xs shadow-md"
                    >
                      🗑️
                    </button>
                    <img src={p.image_url} alt={p.name} className="w-full h-20 object-contain rounded-lg mb-2" />
                    <h4 className="font-bold text-sm text-stone-800 line-clamp-1">{p.name}</h4>
                    <p className="text-red-500 font-bold text-sm">Rs. {p.price}</p>
                    <p className="text-stone-400 text-xs mt-1">{p.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Website Settings</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="border p-4 rounded-xl bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-3">Delivery Timings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-stone-700 mb-1">Start Time</label><input type="text" required value={settingsForm.delivery_start_time || ''} onChange={(e) => setSettingsForm({...settingsForm, delivery_start_time: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="e.g. 8:00 AM" /></div>
                  <div><label className="block text-sm text-stone-700 mb-1">End Time</label><input type="text" required value={settingsForm.delivery_end_time || ''} onChange={(e) => setSettingsForm({...settingsForm, delivery_end_time: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="e.g. 10:00 PM" /></div>
                </div>
              </div>

              {slideFields.map((field) => (
                <div key={field.num} className="border p-4 rounded-xl">
                  <h3 className="font-bold text-stone-700 mb-3">Slide {field.num}</h3>
                  <div className="space-y-3">
                    <input type="url" required value={settingsForm[field.urlKey] || ''} onChange={(e) => setSettingsForm({...settingsForm, [field.urlKey]: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder={`Image URL ${field.num}`} />
                    <input type="text" required value={settingsForm[field.offerKey] || ''} onChange={(e) => setSettingsForm({...settingsForm, [field.offerKey]: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder={`Offer Text ${field.num}`} />
                  </div>
                </div>
              ))}

              <div className="border p-4 rounded-xl bg-green-50">
                <h3 className="font-bold text-green-800 mb-3">Payment Numbers</h3>
                <div className="space-y-3">
                  <input type="text" required value={settingsForm.easypaisa_number || ''} onChange={(e) => setSettingsForm({...settingsForm, easypaisa_number: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="Easypaisa Number" />
                  <input type="text" required value={settingsForm.jazzcash_number || ''} onChange={(e) => setSettingsForm({...settingsForm, jazzcash_number: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="JazzCash Number" />
                </div>
              </div>

              <div><button type="submit" disabled={loadingSettings} className="cursor-pointer bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 disabled:opacity-50">{loadingSettings ? 'Saving...' : 'Update Settings'}</button></div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
