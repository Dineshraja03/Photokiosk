import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const TAX_RATE = 0.0825;
const SHIPPING = 5.99;

function getItemPrice(item) {
  const size = item.printSizes.find((s) => s.label === item.selectedSize);
  return size ? size.price * item.quantity : 0;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function randomOrderNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

export default function Cart() {
  const { cartItems, updateCartItem, removeFromCart, clearCart } = useCart();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item), 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax + (cartItems.length > 0 ? SHIPPING : 0)).toFixed(2);
  const orderDate = new Date();
  const orderNumber = randomOrderNumber();

  const handlePlaceOrder = () => {
    // Mark sessions as ordered in localStorage (simulate backend)
    const sessionIds = Array.from(new Set(cartItems.map(item => item.id.split("-")[0])));
    const stored = localStorage.getItem("orderedSessions");
    let orderedSessions: string[] = stored ? JSON.parse(stored) : [];
    orderedSessions = Array.from(new Set([...orderedSessions, ...sessionIds]));
    localStorage.setItem("orderedSessions", JSON.stringify(orderedSessions));
    clearCart();
    localStorage.setItem("currentUser", JSON.stringify({ role: "operator" }));
    navigate("/");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="mb-4 text-gray-500">Go back and add some photos to your cart.</p>
          <button className="text-blue-600 hover:underline text-sm" onClick={() => window.history.back()}>&larr; Back to Editor</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-2">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 md:p-12 flex flex-col md:flex-row gap-10 md:gap-12 border border-gray-100">
        {/* Left: Cart Items */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 tracking-tight text-gray-900">Photo Cart Invoice</h1>
              <div className="text-sm text-gray-500 font-medium">Order #{orderNumber} &middot; {formatDate(orderDate)}</div>
            </div>
          </div>
          <h2 className="font-semibold text-lg mb-4 text-gray-800">Your Edited Photos</h2>
          <div className="flex flex-col gap-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 rounded-xl shadow-sm p-4 md:p-6">
                <img src={item.thumb} alt={item.name} className="w-24 h-24 object-cover rounded-lg border shadow" />
                <div className="flex-1 min-w-0 w-full">
                  <div className="font-semibold text-base text-gray-900 truncate mb-1">{item.name}</div>
                  {item.editInfo && <div className="text-xs text-gray-500 mb-1">Edited: {item.editInfo}</div>}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <label className="text-xs font-medium">Print Size:</label>
                    <div className="relative">
                      <select
                        className="border rounded-lg px-3 py-2 text-xs shadow-sm focus:ring-2 focus:ring-blue-400 appearance-none pr-8 bg-white"
                        value={item.selectedSize}
                        onChange={e => updateCartItem(item.id, { selectedSize: e.target.value })}
                        style={{ minWidth: 90 }}
                      >
                        {item.printSizes.filter(s => s.label === "4x6" || s.label === "6x8").map((size) => (
                          <option key={size.label} value={size.label}>{size.label} - ${size.price.toFixed(2)}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg width="16" height="16" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                    <label className="text-xs font-medium ml-2">Quantity:</label>
                    <div className="flex items-center border rounded-lg bg-white shadow-sm px-1">
                      <button
                        className="px-2 py-1 text-lg text-gray-500 hover:text-blue-600 focus:outline-none"
                        onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        aria-label="Decrease quantity"
                        type="button"
                      >
                        -
                      </button>
                      <span className="px-2 text-base font-medium min-w-[24px] text-center select-none">{item.quantity}</span>
                      <button
                        className="px-2 py-1 text-lg text-gray-500 hover:text-blue-600 focus:outline-none"
                        onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                        aria-label="Increase quantity"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 min-w-[80px]">
                  <div className="font-bold text-lg text-right text-gray-900">${getItemPrice(item).toFixed(2)}</div>
                  <button className="text-red-500 hover:text-red-700 transition-colors" title="Remove" onClick={() => setDeleteId(item.id)}>
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right: Order Summary */}
        <div className="w-full md:w-96 flex flex-col justify-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col gap-4 sticky top-10">
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Order Summary</h3>
            <div className="flex justify-between text-base font-medium text-gray-700"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-base text-gray-700"><span>Tax (8.25%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-base text-gray-700"><span>Shipping</span><span>${cartItems.length > 0 ? SHIPPING.toFixed(2) : "0.00"}</span></div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between font-bold text-2xl text-gray-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl text-lg shadow-lg transition-all duration-150 active:scale-95" onClick={handlePlaceOrder}>Place Order</button>
            <div className="text-xs text-gray-500 text-center mt-2">Estimated delivery: 5-7 business days</div>
            <div className="text-xs text-gray-400 text-center mt-1">Invoice generated by PhotoKiosk Pro</div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs text-center">
            <h2 className="text-lg font-bold mb-2">Remove Photo?</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to remove this photo from your cart?</p>
            <div className="flex gap-3 justify-center">
              <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium" onClick={() => { removeFromCart(deleteId); setDeleteId(null); }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 