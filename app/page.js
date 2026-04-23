"use client";
import React, { useState, useEffect } from "react";

export default function RestaurantPOS() {
  // --- States หลัก ---
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [viewMode, setViewMode] = useState("pos"); // 'pos' หรือ 'manage'
  
  // --- States สำหรับตัวกรองและค้นหา ---
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All"); // ตัวกรองสถานะออเดอร์
  
  // --- States สำหรับ CRUD เมนู ---
  const [form, setForm] = useState({ name: "", price: "", category: "", image_url: "" });
  const [editId, setEditId] = useState(null);

  // --- States สำหรับบิล, การชำระเงิน และการแสดงผล ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("เงินสด");
  const [showBill, setShowBill] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null); // ควบคุมการกางดูบิล

  // --- ดึงข้อมูลทั้งหมดจาก API (เพิ่มรหัสสุ่มต่อท้าย เพื่อบังคับไม่ให้ Vercel จำข้อมูลเก่า) ---
  const fetchAllData = async () => {
    try {
      // ใส่ ?t=... เพื่อหลอกให้ระบบคิดว่าเป็น URL ใหม่เสมอ
      const resMenu = await fetch(`/api/menus?t=${Date.now()}`, { cache: "no-store" });
      const dataMenu = await resMenu.json();
      setMenus(dataMenu);

      const resOrder = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
      const dataOrder = await resOrder.json();
      setOrders(dataOrder);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // --- ฟังก์ชันจัดการเมนู (CRUD) ---
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

  // --- ฟังก์ชันตะกร้าสินค้า ---
  const addToCart = (menu) => {
    const existing = cart.find((item) => item.id === menu.id);
    if (existing) setCart(cart.map((item) => (item.id === menu.id ? { ...item, qty: item.qty + 1 } : item)));
    else setCart([...cart, { ...menu, qty: 1 }]);
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // --- ฟังก์ชันเรียกหน้าชำระเงิน ---
  const handleCheckout = () => {
    if (cart.length === 0) return alert("กรุณาเลือกรายการอาหาร");
    setShowPaymentModal(true); // เปิดหน้าต่างให้เลือกวิธีจ่ายเงิน
  };

  // --- ฟังก์ชันยืนยันการจ่ายเงินและบันทึกบิล ---
  const confirmPayment = async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        total_price: cartTotal, 
        items: cart,
        payment_method: paymentMethod // ส่งวิธีจ่ายเงินไปด้วย
      }),
    });

    if (res.ok) {
      setLastBill({
        items: [...cart], total: cartTotal,
        date: new Date().toLocaleString("th-TH"),
        orderId: Math.floor(100000 + Math.random() * 900000),
        paymentMethod: paymentMethod // บันทึกวิธีจ่ายเงินลงใบเสร็จ
      });
      setShowPaymentModal(false);
      setShowBill(true); 
      setCart([]); 
      fetchAllData();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกบิล");
    }
  };

  // --- ฟังก์ชันอัปเดตสถานะออเดอร์ (กำลังทำ -> เสร็จสิ้น) ---
  const res = await fetch(`/api/orders/${orderId}`, {
  method: 'PATCH', // <--- ตรงนี้ต้องเป็น PATCH ห้ามเป็น POST หรือ GET
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'เสร็จสิ้น' }),
});

    if (res.ok) {
      fetchAllData(); // ดึงข้อมูลใหม่มาโชว์ทันที
    } else {
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  } catch (error) {
    console.error("Update failed:", error);
  }
};

  // --- ตัวกรองค้นหาเมนู ---
  const categories = ["All", ...new Set((Array.isArray(menus) ? menus : []).map((m) => m.category))];
  const filteredMenus = (Array.isArray(menus) ? menus : []).filter((m) =>
    (filterCategory === "All" || m.category === filterCategory) &&
    (m.name.toLowerCase().includes(search.toLowerCase()))
  );

  // --- ตัวกรองสถานะบิล ---
  const filteredOrdersList = (Array.isArray(orders) ? orders : []).filter((o) => {
    if (orderFilter === "All") return true;
    return (o.status || 'กำลังทำ') === orderFilter;
  });

  return (
    <div className="app-container">
      {/* Navbar พร้อม Gradient และเงา */}
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
          /* ================================
             โหมดหน้าร้าน (Cashier POS)
          ================================ */
          <div className="flex gap-8 h-[calc(100vh-140px)]">
            {/* ฝั่งเลือกเมนู */}
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

            {/* ฝั่งตะกร้าบิล */}
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
                <button onClick={handleCheckout} className="btn-primary py-5 text-xl">
                  <span>💸</span> CHECKOUT
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================================
             โหมดหลังบ้าน (Dashboard & Management)
          ================================ */
          <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
            
            {/* 1. Dashboard Analytics */}
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

            {/* 2. ประวัติออเดอร์แบบแถว (Accordion History) + ฟิลเตอร์ */}
            <div className="panel-card">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <span className="bg-indigo-100 p-2 rounded-xl text-lg">📜</span> Order History
                </h2>
                
                {/* แท็บตัวกรองสถานะ */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setOrderFilter("All")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "All" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>ทั้งหมด</button>
                  <button onClick={() => setOrderFilter("กำลังทำ")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "กำลังทำ" ? "bg-amber-400 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>⏳ กำลังทำ</button>
                  <button onClick={() => setOrderFilter("เสร็จสิ้น")} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "เสร็จสิ้น" ? "bg-green-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>✅ เสร็จสิ้น</button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {filteredOrdersList.length === 0 ? <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest">ไม่มีบิลในหมวดหมู่นี้</p> : 
                 filteredOrdersList.slice(0, 15).map((order) => (
                  <div key={order.id} className="bg-white border-2 border-slate-50 rounded-3xl overflow-hidden transition-all hover:border-indigo-100 hover:shadow-xl">
                    {/* Header แถวบิล */}
                    <div 
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className="flex justify-between items-center p-6 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex gap-6 items-center">
                        <span className="font-black text-indigo-600 text-lg">#{order.id}</span>
                        
                        {/* ปุ่มสถานะออเดอร์ (Update Function) */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateOrderStatus(order.id, order.status); }}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transform hover:scale-110 active:scale-95 ${
                            order.status === 'เสร็จสิ้น' 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                            : 'bg-amber-400 text-white shadow-lg shadow-amber-100'
                          }`}
                        >
                          {order.status || 'กำลังทำ'}
                        </button>

                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{new Date(order.created_at).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="text-2xl font-black text-slate-800 tracking-tighter">฿{order.total_price.toLocaleString()}</span>
                        <span className={`text-slate-300 text-xl transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>

                    {/* รายละเอียดสินค้าข้างใน (กางออกเมื่อคลิก) */}
                    {expandedOrderId === order.id && (
                      <div className="p-8 border-t-2 border-dashed border-slate-100 bg-white animate-in slide-in-from-top-4 duration-300">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Itemized Receipt</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm items-center border-b border-slate-50 pb-2">
                              <span className="text-slate-600 font-bold">
                                {item.menu_name} <span className="text-slate-300 ml-2">x{item.qty}</span>
                              </span>
                              <span className="font-black text-slate-900">฿{(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. ส่วนจัดการเมนู (CRUD) */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* ตารางเมนู */}
              <div className="panel-card flex-1 w-full overflow-hidden">
                <h2 className="text-2xl font-black mb-8">Menu Management</h2>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead className="table-header">
                      <tr><th className="p-6">Menu</th><th className="p-6">Category</th><th className="p-6">Price</th><th className="p-6 text-center">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(Array.isArray(menus) ? menus : []).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <img src={m.image_url || "https://placehold.co/100"} className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:rotate-3 transition-transform" />
                              <span className="font-bold text-slate-700">{m.name}</span>
                            </div>
                          </td>
                          <td className="p-6"><span className="category-badge">{m.category}</span></td>
                          <td className="p-6 font-black text-indigo-600">฿{m.price}</td>
                          <td className="p-6 text-center space-x-6">
                            <button onClick={() => handleEdit(m)} className="text-amber-500 font-black text-xs uppercase tracking-widest hover:text-amber-600">Edit</button>
                            <button onClick={() => handleDelete(m.id)} className="text-red-400 font-black text-xs uppercase tracking-widest hover:text-red-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ฟอร์มเพิ่ม/แก้ไข */}
              <div className="panel-card w-full lg:w-[400px] h-fit sticky top-28 border-t-4 border-indigo-500 shadow-2xl shadow-indigo-100">
                <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">{editId ? "✏️ Edit Item" : "➕ Add New Item"}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div><label className="input-label">Food Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="input-label">Price (฿)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" required /></div>
                    <div><label className="input-label">Category</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" required /></div>
                  </div>
                  <div><label className="input-label">Image URL</label><input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." /></div>
                  <button type="submit" className={editId ? "btn-primary bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "btn-secondary"}>
                    {editId ? "UPDATE MENU" : "SAVE NEW MENU"}
                  </button>
                  {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: "", price: "", category: "", image_url: "" }); }} className="w-full text-slate-400 font-bold py-2 mt-2">Cancel</button>}
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================================
         Payment Selection Modal (หน้าจอชำระเงิน)
      ================================ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] p-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">PAYMENT</h2>
            <p className="text-slate-400 font-bold text-sm mb-8">เลือกวิธีการชำระเงินสำหรับบิลนี้</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* ตัวเลือกเงินสด */}
              <div 
                onClick={() => setPaymentMethod("เงินสด")}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "เงินสด" ? "border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="text-4xl drop-shadow-sm">💵</span>
                <span className="font-black text-sm uppercase tracking-widest text-slate-700">Cash</span>
              </div>
              
              {/* ตัวเลือก PromptPay */}
              <div 
                onClick={() => setPaymentMethod("PromptPay")}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 ${paymentMethod === "PromptPay" ? "border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="text-4xl drop-shadow-sm">📱</span>
                <span className="font-black text-sm uppercase tracking-widest text-slate-700">PromptPay</span>
              </div>
            </div>

            {/* โชว์ QR Code ถ้าเลือก PromptPay */}
            {paymentMethod === "PromptPay" && (
              <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                <p className="text-[10px] font-black text-slate-400 mb-4 tracking-[0.2em] uppercase">Scan to Pay <span className="text-indigo-600">฿{cartTotal.toLocaleString()}</span></p>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPTPAY_${cartTotal}`} alt="QR Code" className="w-32 h-32" />
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button onClick={confirmPayment} className="btn-primary flex-1 shadow-indigo-100">ยืนยันการชำระเงิน</button>
              <button onClick={() => setShowPaymentModal(false)} className="btn-outline border-none bg-slate-50 text-slate-400 hover:bg-slate-100">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================
         Bill Receipt Modal (ป๊อปอัพใบเสร็จ)
      ================================ */}
      {showBill && lastBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 print:bg-white print:p-0 print:items-start">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] p-12 overflow-hidden transform animate-in zoom-in-95 duration-300 print:rounded-none print:shadow-none print:p-6 print:max-w-[80mm] print:mx-auto">
            <div id="receipt" className="text-center text-slate-900 print:text-black">
              
              <span className="text-6xl block mb-6 drop-shadow-lg print:drop-shadow-none print:text-4xl print:mb-3">🍔</span>
              <h2 className="text-3xl font-black tracking-tighter mb-2 print:text-2xl">RESTOPOS</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-[0.3em] print:text-black print:mb-4">
                Bill #{lastBill.orderId} <br className="hidden print:block" /> {lastBill.date}
              </p>
              
              <div className="space-y-4 mb-6 border-t-2 border-dashed border-slate-100 pt-8 print:pt-4 print:mb-4 print:border-black print:space-y-2">
                {lastBill.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm font-black print:text-xs">
                    <span className="text-slate-500 print:text-black">{it.name} <span className="text-slate-300 text-[10px] ml-1 print:text-black">x{it.qty}</span></span>
                    <span className="text-slate-800 print:text-black">฿{(it.price * it.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* แสดงวิธีจ่ายเงินในใบเสร็จ */}
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-6 border-b-2 border-dashed border-slate-100 print:border-black print:mb-4 print:pb-4 print:text-black">
                <span>Payment Method</span>
                <span className="text-slate-700 print:text-black">{lastBill.paymentMethod}</span>
              </div>
              
              <div className="flex justify-between items-center mb-10 print:mb-6">
                <span className="font-black text-slate-400 text-xs uppercase tracking-widest print:text-black">Total</span>
                <span className="text-5xl font-black text-indigo-600 tracking-tighter print:text-black print:text-2xl">฿{lastBill.total.toLocaleString()}</span>
              </div>
              
              <p className="text-slate-300 text-[9px] font-bold italic uppercase mb-2 print:text-black">Thank you! Please come again</p>
              
              {/* รอยปรุด้านล่าง (ซ่อนตอนปริ้น) */}
              <div className="flex justify-center gap-1 opacity-10 print:hidden">
                 {[...Array(24)].map((_, i) => <div key={i} className="w-1 h-6 bg-black rounded-full" />)}
              </div>
            </div>
            
            {/* ปุ่มกด (ซ่อนตอนปริ้น) */}
            <div className="flex gap-4 mt-10 print:hidden">
              <button onClick={() => window.print()} className="btn-primary flex-1 shadow-indigo-100">PRINT</button>
              <button onClick={() => setShowBill(false)} className="btn-outline border-none bg-slate-50 text-slate-400 hover:bg-slate-100">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* สไตล์สำหรับการสั่งพิมพ์ (ซ่อนส่วนที่ไม่ต้องการและล้างสีพื้นหลัง) */}
      <style jsx global>{`
        @media print {
          nav, main { display: none !important; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          * { box-shadow: none !important; text-shadow: none !important; }
          @page { margin: 0.5cm; } /* ลบหัวกระดาษ/ท้ายกระดาษอัตโนมัติของ Chrome */
        }
      `}</style>
    </div>
  );
}