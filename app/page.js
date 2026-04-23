"use client";
import React, { useState, useEffect } from "react";

export default function RestaurantPOS() {
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [viewMode, setViewMode] = useState("pos");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [form, setForm] = useState({ name: "", price: "", category: "", image_url: "" });
  const [editId, setEditId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("เงินสด");
  const [showBill, setShowBill] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchAllData = async () => {
    try {
      const resMenu = await fetch(`/api/menus?t=${Date.now()}`, { cache: "no-store" });
      const dataMenu = await resMenu.json();
      setMenus(Array.isArray(dataMenu) ? dataMenu : []);
      const resOrder = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
      const dataOrder = await resOrder.json();
      setOrders(Array.isArray(dataOrder) ? dataOrder : []);
    } catch (error) { console.error("Fetch error:", error); }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/menus/${editId}` : "/api/menus";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", price: "", category: "", image_url: "" });
    setEditId(null);
    fetchAllData();
  };

  const handleEdit = (menu) => {
    setForm({ name: menu.name, price: menu.price, category: menu.category, image_url: menu.image_url });
    setEditId(menu.id);
  };

  const handleDelete = async (id) => {
    if (confirm("ยืนยันการลบเมนูนี้?")) {
      await fetch(`/api/menus/${id}`, { method: "DELETE" });
      fetchAllData();
    }
  };

  const addToCart = (menu) => {
    const existing = cart.find((item) => item.id === menu.id);
    if (existing) setCart(cart.map((item) => (item.id === menu.id ? { ...item, qty: item.qty + 1 } : item)));
    else setCart([...cart, { ...menu, qty: 1 }]);
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return alert("กรุณาเลือกรายการอาหาร");
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_price: cartTotal, items: cart, payment_method: paymentMethod }),
      });
      if (res.ok) {
        setLastBill({
          items: [...cart], total: cartTotal,
          date: new Date().toLocaleString("th-TH"),
          orderId: Math.floor(100000 + Math.random() * 900000),
          paymentMethod: paymentMethod 
        });
        setShowPaymentModal(false);
        setShowBill(true); 
        setCart([]); 
        fetchAllData();
      } else { alert("เกิดข้อผิดพลาดในการบันทึกบิล"); }
    } catch (error) { console.error("Payment failed:", error); }
  };

  // --- ฟังก์ชันอัปเดตสถานะ (PATCH) ป้องกัน undefined โดยส่ง null แทน ---
  const handleUpdateOrderStatus = async (id, currentStatus) => {
    if (!id) return;
    const nextStatus = (currentStatus === 'เสร็จสิ้น') ? 'กำลังทำ' : 'เสร็จสิ้น';
    
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: nextStatus // ห้ามเปลี่ยนชื่อตัวแปรนี้นะครับ ต้องชื่อ status เท่านั้น
        }),
      });

      if (res.ok) {
        fetchAllData(); 
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const categories = ["All", ...new Set((Array.isArray(menus) ? menus : []).map((m) => m.category))];
  const filteredMenus = (Array.isArray(menus) ? menus : []).filter((m) =>
    (filterCategory === "All" || m.category === filterCategory) &&
    (m.name.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredOrdersList = (Array.isArray(orders) ? orders : []).filter((o) => {
    if (orderFilter === "All") return true;
    return (o.status || 'กำลังทำ') === orderFilter;
  });

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍔</span>
          <h1 className="text-2xl font-black tracking-tighter">RESTO<span className="text-indigo-200">POS</span></h1>
        </div>
        <div className="flex bg-black/10 p-1 rounded-2xl backdrop-blur-md">
          <button onClick={() => setViewMode("pos")} className={viewMode === "pos" ? "btn-nav-active" : "btn-nav"}>หน้าร้าน</button>
          <button onClick={() => setViewMode("manage")} className={viewMode === "manage" ? "btn-nav-active" : "btn-nav"}>หลังบ้าน</button>
        </div>
      </nav>

      <main className="p-6">
        {viewMode === "pos" ? (
          <div className="flex gap-8 h-[calc(100vh-140px)]">
            <div className="panel-card flex-1 flex flex-col overflow-hidden">
              <input type="text" placeholder="🔍 ค้นหาเมนูอาหาร..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field mb-6" />
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-6 py-2 rounded-full font-bold transition-all ${filterCategory === cat ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2">
                {filteredMenus.map((menu) => (
                  <div key={menu.id} onClick={() => addToCart(menu)} className="group menu-item">
                    <div className="overflow-hidden rounded-[1.5rem] mb-3 shadow-inner bg-slate-100">
                      <img src={menu.image_url || "https://placehold.co/400x300?text=Food"} className="w-full h-36 object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="font-bold text-slate-800 truncate">{menu.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{menu.category}</span>
                      <span className="text-indigo-600 font-black text-lg">฿{menu.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card w-[400px] flex flex-col border-l-4 border-indigo-50">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="text-2xl text-indigo-600">🧾</span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">ORDER BILL</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                    <span className="text-7xl">🛒</span>
                    <p className="font-black uppercase tracking-widest text-xs">No items selected</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-transparent hover:border-indigo-100 transition-all group">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-700">{item.name}</h4>
                        <p className="text-xs font-bold text-slate-400">฿{item.price} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-indigo-600">฿{item.price * item.qty}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-all text-xl">✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
                <div className="flex justify-between text-3xl font-black text-slate-900 mb-6 tracking-tighter">
                  <span className="text-slate-400 text-sm self-center uppercase tracking-widest">Grand Total</span>
                  <span>฿{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} className="btn-primary py-5 text-xl"><span>💸</span> CHECKOUT</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="panel-card bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-indigo-200 shadow-2xl">
                <h3 className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2">Total Revenue</h3>
                <p className="text-5xl font-black tracking-tighter">฿{(Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + Number(o.total_price), 0).toLocaleString()}</p>
              </div>
              <div className="panel-card">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Orders Today</h3>
                <p className="text-5xl font-black text-slate-800 tracking-tighter">{(Array.isArray(orders) ? orders : []).length} <span className="text-lg text-slate-300 ml-2">Bills</span></p>
              </div>
              <div className="panel-card">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Avg. Ticket Size</h3>
                <p className="text-5xl font-black text-slate-800 tracking-tighter">฿{(Array.isArray(orders) ? orders : []).length > 0 ? Math.round((Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + Number(o.total_price), 0) / (Array.isArray(orders) ? orders : []).length).toLocaleString() : 0}</p>
              </div>
            </div>

            <div className="panel-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="bg-indigo-100 p-2 rounded-xl text-lg">📜</span> Order History</h2>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setOrderFilter("All")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "All" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>ทั้งหมด</button>
                  <button onClick={() => setOrderFilter("กำลังทำ")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "กำลังทำ" ? "bg-amber-400 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>⏳ กำลังทำ</button>
                  <button onClick={() => setOrderFilter("เสร็จสิ้น")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "เสร็จสิ้น" ? "bg-green-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>✅ เสร็จสิ้น</button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {filteredOrdersList.length === 0 ? <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest">ไม่มีบิลในหมวดหมู่นี้</p> : 
                 filteredOrdersList.map((order) => (
                  <div key={order.id} className="bg-white border-2 border-slate-50 rounded-3xl overflow-hidden transition-all hover:border-indigo-100 hover:shadow-xl">
                    <div onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="flex justify-between items-center p-6 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-6 items-center">
                        <span className="font-black text-indigo-600 text-lg">#{order.id}</span>
                        <button 
  onClick={(e) => { 
    e.stopPropagation(); 
    handleUpdateOrderStatus(order.id, order.status); 
  }}
  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transform hover:scale-110 active:scale-95 ${
    order.status === 'เสร็จสิ้น' ? 'bg-green-500 text-white shadow-lg' : 'bg-amber-400 text-white shadow-lg'
  }`}
>
  {order.status || 'กำลังทำ'}
</button>
                        <span className="text-xs font-bold text-slate-400">{new Date(order.created_at).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="text-2xl font-black text-slate-800 tracking-tighter">฿{Number(order.total_price).toLocaleString()}</span>
                        <span className={`text-slate-300 text-xl transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>
                    {expandedOrderId === order.id && (
                      <div className="p-8 border-t-2 border-dashed border-slate-100 bg-white">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Itemized Receipt</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          {Array.isArray(order.items) && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                              <span className="text-slate-600 font-bold">{item.name} x{item.qty}</span>
                              <span className="font-black text-slate-900">฿{(Number(item.price) * item.qty).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="panel-card flex-1 w-full overflow-hidden">
                <h2 className="text-2xl font-black mb-8">Menu Management</h2>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="table-header">
                      <tr><th className="p-6">Menu</th><th className="p-6">Category</th><th className="p-6">Price</th><th className="p-6 text-center">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(Array.isArray(menus) ? menus : []).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <img src={m.image_url || "https://placehold.co/100"} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                              <span className="font-bold text-slate-700">{m.name}</span>
                            </div>
                          </td>
                          <td className="p-6"><span className="category-badge">{m.category}</span></td>
                          <td className="p-6 font-black text-indigo-600">฿{m.price}</td>
                          <td className="p-6 text-center space-x-6">
                            <button onClick={() => handleEdit(m)} className="text-amber-500 font-black text-xs uppercase hover:text-amber-600">Edit</button>
                            <button onClick={() => handleDelete(m.id)} className="text-red-400 font-black text-xs uppercase hover:text-red-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel-card w-full lg:w-[400px] h-fit sticky top-28 border-t-4 border-indigo-500">
                <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">{editId ? "✏️ Edit Item" : "➕ Add New Item"}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div><label className="input-label">Food Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="input-label">Price (฿)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" required /></div>
                    <div><label className="input-label">Category</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" required /></div>
                  </div>
                  <div><label className="input-label">Image URL</label><input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." /></div>
                  <button type="submit" className={editId ? "btn-primary bg-amber-500 hover:bg-amber-600" : "btn-secondary"}>{editId ? "UPDATE MENU" : "SAVE NEW MENU"}</button>
                  {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", price: "", category: "", image_url: "" }); }} className="w-full text-slate-400 font-bold py-2 mt-2">Cancel</button>}
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 overflow-hidden">
            <h2 className="text-3xl font-black text-slate-800 mb-2">PAYMENT</h2>
            <div className="grid grid-cols-2 gap-4 my-8">
              <div onClick={() => setPaymentMethod("เงินสด")} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "เงินสด" ? "border-indigo-600 bg-indigo-50" : "border-slate-100"}`}>
                <span className="text-4xl">💵</span><span className="font-black text-sm uppercase text-slate-700">Cash</span>
              </div>
              <div onClick={() => setPaymentMethod("PromptPay")} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "PromptPay" ? "border-indigo-600 bg-indigo-50" : "border-slate-100"}`}>
                <span className="text-4xl">📱</span><span className="font-black text-sm uppercase text-slate-700">PromptPay</span>
              </div>
            </div>
            {paymentMethod === "PromptPay" && (
              <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex flex-col items-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPTPAY_${cartTotal}`} alt="QR Code" className="w-32 h-32 mb-4" />
                <p className="text-indigo-600 font-bold text-xl">฿{cartTotal.toLocaleString()}</p>
              </div>
            )}
            <div className="flex gap-4">
              <button onClick={confirmPayment} className="btn-primary flex-1">ยืนยันการชำระเงิน</button>
              <button onClick={() => setShowPaymentModal(false)} className="btn-outline border-none bg-slate-50 text-slate-400">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {showBill && lastBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 print:bg-white">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-12">
            <div className="text-center">
              <span className="text-6xl block mb-6">🍔</span>
              <h2 className="text-3xl font-black mb-2">RESTOPOS</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Bill #{lastBill.orderId} - {lastBill.date}</p>
              <div className="space-y-4 mb-6 border-t-2 border-dashed border-slate-100 pt-8">
                {lastBill.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm font-black">
                    <span>{it.name} x{it.qty}</span>
                    <span>฿{(it.price * it.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mb-10"><span className="font-black text-slate-400 uppercase">Total</span><span className="text-5xl font-black text-indigo-600">฿{lastBill.total.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-4 print:hidden">
              <button onClick={() => window.print()} className="btn-primary flex-1">PRINT</button>
              <button onClick={() => setShowBill(false)} className="btn-outline flex-1">CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}