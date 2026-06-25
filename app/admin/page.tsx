'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({ name: '', price: '', category: 'Bakery', description: '', imageUrl: '' });
  const [bulkJson, setBulkJson] = useState('');
  
  const [settingsForm, setSettingsForm] = useState<any>({ 
    hero_image_url: '', hero_offer_text: '', 
    hero_image_url_2: '', hero_offer_text_2: '',
    hero_image_url_3: '', hero_offer_text_3: '',
    jazzcash_number: '', easypaisa_number: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (data) setSettingsForm(data);
  };

  useEffect(() => {
    fetchOrders();
    fetchSettings();

    const channel = supabase
      .channel('admin-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prevOrders) => [payload.new, ...prevOrders]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prevOrders) => prevOrders.map((o) => o.id === payload.new.id ? payload.new : o));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert('Error updating status: ' + error.message);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([
      { name: productForm.name, price: parseFloat(productForm.price), category: productForm.category, description: productForm.description, image_url: productForm.imageUrl, is_available: true }
    ]);
    if (!error) {
      alert('Product added successfully!');
      setProductForm({ name: '', price: '', category: 'Bakery', description: '', imageUrl: '' });
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleBulkAdd = async () => {
    try {
      const items = JSON.parse(bulkJson);
      const formattedItems = items.map((item: any) => ({
        name: item.name, price: parseFloat(item.price), category: item.category, description: item.description, image_url: item.imageUrl, is_available: true
      }));
      const { error } = await supabase.from('products').insert(formattedItems);
      if (!error) { alert(`${items.length} products added successfully!`); setBulkJson(''); } 
      else { alert('Error: ' + error.message); }
    } catch (err) { alert('Invalid JSON format.'); }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSettings(true);
    const { error } = await supabase.from('settings').update({
      hero_image_url: settingsForm.hero_image_url,
      hero_offer_text: settingsForm.hero_offer_text,
      hero_image_url_2: settingsForm.hero_image_url_2,
      hero_offer_text_2: settingsForm.hero_offer_text_2,
      hero_image_url_3: settingsForm.hero_image_url_3,
      hero_offer_text_3: settingsForm.hero_offer_text_3,
      jazzcash_number: settingsForm.jazzcash_number,
      easypaisa_number: settingsForm.easypaisa_number
    }).eq('id', 1);

    if (!error) alert('Website updated successfully!');
    else alert('Error: ' + error.message);
    setLoadingSettings(false);
  };

  const slideFields = [
    { urlKey: 'hero_image_url', offerKey: 'hero_offer_text', num: 1 },
    { urlKey: 'hero_image_url_2', offerKey: 'hero_offer_text_2', num: 2 },
    { urlKey: 'hero_image_url_3', offerKey: 'hero_offer_text_3', num: 3 }
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-64 bg-stone-900 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold text-amber-400 mb-8">Bakery Admin</h2>
        <nav className="space-y-4">
          <button onClick={() => setActiveTab('orders')} className={`cursor-pointer block w-full text-left py-2 px-4 rounded-lg ${activeTab === 'orders' ? 'bg-amber-500 text-stone-900' : 'hover:bg-stone-800'}`}>📦 Orders Management</button>
          <button onClick={() => setActiveTab('products')} className={`cursor-pointer block w-full text-left py-2 px-4 rounded-lg ${activeTab === 'products' ? 'bg-amber-500 text-stone-900' : 'hover:bg-stone-800'}`}>🍰 Product Management</button>
          <button onClick={() => setActiveTab('settings')} className={`cursor-pointer block w-full text-left py-2 px-4 rounded-lg ${activeTab === 'settings' ? 'bg-amber-500 text-stone-900' : 'hover:bg-stone-800'}`}>⚙️ Website Settings</button>
        </nav>
      </aside>

      <main className="flex-grow p-8">
        {activeTab === 'orders' ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
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
                    <th className="py-3 px-4 text-sm font-semibold text-stone-600">Map</th> 
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-stone-100 hover:bg-stone-50 align-top">
                      <td className="py-4 px-4 text-xs font-medium text-stone-800">{order.id.substring(0, 8)}</td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-stone-800">{order.customer_name}</p>
                        <p className="text-xs text-stone-500">{order.phone}</p>
                        <p className="text-xs text-stone-400 mt-1 md:hidden">{order.address}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-stone-600">
                        <ul className="list-disc list-inside">
                          {order.items?.map((item: any, index: number) => (
                            <li key={index}>
                              {item.quantity}x {item.name} <span className="text-stone-400">(Rs. {item.price})</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-stone-400 mt-1 hidden md:block">{order.address}</p>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-stone-800">Rs. {order.total_amount}</td>
                      <td className="py-4 px-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${order.payment_method === 'COD' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {order.payment_method || 'COD'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-stone-700">
                        {order.transaction_id ? order.transaction_id : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="text-xs border border-stone-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white cursor-pointer text-stone-900">
                          <option>Pending</option>
                          <option>Preparing</option>
                          <option>Out for Delivery</option>
                          <option>Delivered</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        {order.latitude && order.longitude ? (
                          <a href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`} target="_blank" rel="noreferrer" className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-700 inline-block cursor-pointer">View Map 📍</a>
                        ) : ( <span className="text-xs text-stone-400">No Location</span> )}
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
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Category</label><select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl bg-white cursor-pointer text-stone-900"><option>Bakery</option><option>Fast Food</option><option>Desserts & Snacks</option><option>Beverages</option><option>General Store</option></select></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Image URL</label><input type="url" required value={productForm.imageUrl} onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="https://..." /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-stone-700 mb-1">Description</label><textarea required rows={4} value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} className="w-full p-3 border border-stone-300 rounded-xl text-stone-900" placeholder="Describe the product..."></textarea></div>
                <div className="md:col-span-2"><button type="submit" className="cursor-pointer bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700">Save Product</button></div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 mb-4">Bulk Add Products</h2>
              <textarea rows={6} value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} className="w-full p-3 border border-stone-300 rounded-xl font-mono text-sm text-stone-900 bg-white" placeholder='[ { "name": "Item 1", "price": 100, ... } ]'></textarea>
              <button onClick={handleBulkAdd} className="cursor-pointer mt-4 bg-stone-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-stone-900">Add Bulk Products</button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Website Hero & Payment Settings</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              
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

              <div>
                <button type="submit" disabled={loadingSettings} className="cursor-pointer bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 disabled:opacity-50">
                  {loadingSettings ? 'Saving...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
