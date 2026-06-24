'use client';
import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-stone-200">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-stone-800 mb-2">Order Placed!</h1>
        <p className="text-stone-600 mb-8">
          Thank you for your order. We have received your request and will contact you shortly for confirmation.
        </p>
        
        <div className="flex flex-col gap-4">
          <Link href="/orders" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition">
            Track My Order
          </Link>
          <Link href="/" className="w-full bg-stone-100 text-stone-800 font-bold py-3 rounded-xl hover:bg-stone-200 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
