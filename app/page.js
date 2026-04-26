"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

export default function RestaurantPOS() {
  // --- ระบบ Auth ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // 'login' หรือ 'register'
  const [authForm, setAuthForm] = useState({ username: "", password: "", role: "cashier" });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // -------------------- STATE (ตัวแปรเก็บข้อมูล) --------------------
  const [menus, setMenus] = useState([]); // เก็บรายการเมนูทั้งหมด
  const [orders, setOrders] = useState([]); // เก็บรายการออเดอร์ทั้งหมด
  const [cart, setCart] = useState([]); // ตะกร้าสินค้า
  const [viewMode, setViewMode] = useState("pos"); // สลับหน้า pos / หลังบ้าน
  const [search, setSearch] = useState(""); // ค้นหาเมนู
  const [filterCategory, setFilterCategory] = useState("All"); // filter หมวดหมู่
  const [orderFilter, setOrderFilter] = useState("All"); // filter สถานะออเดอร์

  // ฟอร์มเพิ่ม/แก้ไขเมนู
  const [form, setForm] = useState({ name: "", price: "", category: "", image_url: "" });
  const [editId, setEditId] = useState(null); // id เมนูที่กำลังแก้ไข
  
  // -------------------- PAYMENT / BILL --------------------
  const [showPaymentModal, setShowPaymentModal] = useState(false); // เปิด modal ชำระเงิน
  const [paymentMethod, setPaymentMethod] = useState("เงินสด"); // วิธีจ่ายเงิน
  const [orderType, setOrderType] = useState("ทานที่ร้าน"); // ประเภทออเดอร์
  const [tableNo, setTableNo] = useState(""); // เลขโต๊ะ
  const [showBill, setShowBill] = useState(false); // แสดงบิล
  const [lastBill, setLastBill] = useState(null); // เก็บบิลล่าสุด
  const [expandedOrderId, setExpandedOrderId] = useState(null); // เปิด/ปิดดูรายละเอียดออเดอร์
  const [isLoading, setIsLoading] = useState(false); // loading state

   // -------------------- MODAL เลือกจำนวน --------------------
  const [selectedMenu, setSelectedMenu] = useState(null); // เมนูที่เลือก
  const [qtyToAdd, setQtyToAdd] = useState(1); // จำนวนที่จะเพิ่ม


  //FETCH DATA
  const fetchAllData = async () => {
    if (!currentUser) return; // เพิ่มเงื่อนไขให้ดึงข้อมูลเฉพาะตอน Login แล้ว
    try {
       // ดึงเมนู
      const resMenu = await fetch(`/api/menus?t=${Date.now()}`, { cache: "no-store" });
      const dataMenu = await resMenu.json();
      setMenus(Array.isArray(dataMenu) ? dataMenu : []);

      // ดึงออเดอร์
      const resOrder = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
      const dataOrder = await resOrder.json();
      setOrders(Array.isArray(dataOrder) ? dataOrder : []);
    } catch (error) { console.error("Fetch error:", error); }
  };

  // โหลดข้อมูลครั้งแรก
  useEffect(() => { fetchAllData(); }, [currentUser]); // เพิ่ม currentUser เป็น dependency

  // --- ระบบ Login & Register ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const url = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();

      if (res.ok) {
        if (authMode === "login") {
          setCurrentUser(data.user);
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `ยินดีต้อนรับคุณ ${data.user.username}`, showConfirmButton: false, timer: 1500 });
        } else {
          Swal.fire('สำเร็จ!', 'สมัครสมาชิกเรียบร้อย กรุณาเข้าสู่ระบบ', 'success');
          setAuthMode("login");
          setAuthForm({ ...authForm, password: "" });
        }
      } else {
        Swal.fire('ผิดพลาด', data.error, 'error');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
    }).then((result) => {
      if (result.isConfirmed) {
        setCurrentUser(null);
        setViewMode("pos");
        setCart([]);
      }
    });
  };

  // --- หากยังไม่ได้ Login ให้แสดงหน้า Auth ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md z-10 border border-white">
          <div className="text-center mb-10">
            <span className="text-6xl mb-4 block animate-bounce">🍽️</span>
            <h1 className="text-4xl font-black tracking-tighter text-slate-800">เจ้านายหมูทอด</h1>
            <p className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">{authMode === 'login' ? 'เข้าสู่ระบบเพื่อเริ่มใช้งาน' : 'ลงทะเบียนผู้ใช้งานใหม่'}</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div>
              <label className="input-label">Username</label>
              <input type="text" value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})} className="input-field bg-white" required placeholder="ชื่อผู้ใช้งาน..." />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="input-field bg-white" required placeholder="รหัสผ่าน..." />
            </div>
            
            {authMode === 'register' && (
              <div className="animate-in fade-in">
                <label className="input-label">Role (สิทธิ์ผู้ใช้งาน)</label>
                <select value={authForm.role} onChange={(e) => setAuthForm({...authForm, role: e.target.value})} className="input-field bg-white font-bold text-slate-600">
                  <option value="cashier">👨‍🍳 พนักงานแคชเชียร์</option>
                  <option value="manager">👑 ผู้จัดการร้าน (Manager)</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={isAuthLoading} className="btn-primary w-full py-4 text-lg mt-8 disabled:opacity-50">
              {isAuthLoading ? "กำลังประมวลผล..." : (authMode === 'login' ? "เข้าสู่ระบบ (LOGIN)" : "สมัครสมาชิก (REGISTER)")}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthForm({ username: "", password: "", role: "cashier" }); }} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              {authMode === 'login' ? 'ยังไม่มีบัญชีใช่ไหม? กดเพื่อสมัครสมาชิก' : 'มีบัญชีอยู่แล้ว? กดเพื่อเข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- CRUD เมนู ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // กันราคาเป็นลบ
    if (form.price < 0) return Swal.fire("เดี๋ยวก่อน!", "ราคาอาหารห้ามติดลบนะครับ", "warning");

    setIsLoading(true);

    // ถ้ามี editId = แก้ไข, ไม่มี = เพิ่ม
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/menus/${editId}` : "/api/menus";
    
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // แจ้งเตือนสำเร็จ
      Swal.fire({ 
        icon: 'success', 
        title: editId ? 'อัปเดตเมนูสำเร็จ!' : 'เพิ่มเมนูสำเร็จ!', 
        showConfirmButton: false, 
        timer: 1500 
      });

      // รีเซ็ตฟอร์ม
      setForm({ name: "", price: "", category: "", image_url: "" });
      setEditId(null);
      fetchAllData();
    } catch (error) {
      Swal.fire("ข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    } finally { setIsLoading(false); }
  };

  // โหลดข้อมูลมาแก้ไข
  const handleEdit = (menu) => {
    setForm({ 
      name: menu.name, 
      price: menu.price, 
      category: menu.category, 
      image_url: menu.image_url });
    setEditId(menu.id);
  };

  // ลบเมนู
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'ยืนยันการลบ?', 
      text: "ลบแล้วจะไม่สามารถกู้ข้อมูลคืนได้นะครับ", 
      icon: 'warning',
      showCancelButton: true, 
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบเลย!', 
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          await fetch(`/api/menus/${id}`, { method: "DELETE" });
          fetchAllData();
          Swal.fire('ลบแล้ว!', 'เมนูถูกลบออกจากระบบเรียบร้อย', 'success');
        } catch (error) { Swal.fire('ผิดพลาด', 'ไม่สามารถลบเมนูได้', 'error'); } 
        finally { setIsLoading(false); }
      }
    });
  };

  // CART
  const handleMenuClick = (menu) => {
    setSelectedMenu(menu); // เปิดหน้าต่าง Modal
    setQtyToAdd(1); // รีเซ็ตจำนวนให้เริ่มที่ 1 ทุกครั้ง
  };

  // เพิ่มลงตะกร้า
  const confirmAddToCart = () => {
    if (!selectedMenu) return;
    
    const existing = cart.find((item) => item.id === selectedMenu.id);
    // ถ้ามีอยู่แล้ว เพิ่มจำนวน
    if (existing) {
      setCart(cart.map((item) => (item.id === selectedMenu.id ? { ...item, qty: item.qty + qtyToAdd } : item)));
    } else {
      // ถ้ายังไม่มี เพิ่มใหม่
      setCart([...cart, { ...selectedMenu, qty: qtyToAdd }]);
    }
    
    // โชว์แจ้งเตือนเล็กๆ ว่าเพิ่มแล้ว
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `เพิ่ม ${selectedMenu.name} x${qtyToAdd} ลงตะกร้า`, showConfirmButton: false, timer: 1000 });
    
    setSelectedMenu(null); // ปิดหน้าต่าง Modal
  };

  // ลบออกจากตะกร้า
  const removeFromCart = (id) => 
    setCart(cart.filter((item) => item.id !== id));

  // คำนวณราคารวม
  const cartTotal = cart.reduce((sum, item) => 
    sum + item.price * item.qty, 0);

  //Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return Swal.fire("ตะกร้าว่างเปล่า", "กรุณาเลือกรายการอาหารก่อนชำระเงินครับ", "info");
    setShowPaymentModal(true);
  };

  // ยืนยันชำระเงิน
  const confirmPayment = async () => {
    if (orderType === "ทานที่ร้าน" && !tableNo) {
      return Swal.fire("ลืมอะไรหรือเปล่า?", "กรุณาระบุหมายเลขโต๊ะด้วยครับ", "warning");
    }

    setIsLoading(true);
    Swal.fire({ title: 'กำลังบันทึกบิล...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

    const cartWithDetails = cart.map(item => ({...item, orderType, tableNo}));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          total_price: cartTotal, 
          items: cartWithDetails,
          payment_method: paymentMethod 
        }),
      });
      const result = await res.json();

      // สร้างบิล
      if (res.ok) {
        setLastBill({
          items: [...cart], total: cartTotal,
          date: new Date().toLocaleString("th-TH"),
          orderId: result.id, paymentMethod: paymentMethod,
          orderType: orderType, tableNo: tableNo 
        });
        setShowPaymentModal(false);
        setShowBill(true); 
        setCart([]); 
        setTableNo(""); 
        fetchAllData(); 
        Swal.close();
      } else { Swal.fire("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการบันทึกบิล", "error"); }
    } catch (error) { Swal.fire("ข้อผิดพลาด", "การเชื่อมต่อมีปัญหา", "error"); } 
    finally { setIsLoading(false); }
  };

  const handleUpdateOrderStatus = async (id, currentStatus) => {
    if (!id || id === 'undefined') return;
    const nextStatus = (currentStatus === 'เสร็จสิ้น') ? 'กำลังทำ' : 'เสร็จสิ้น';
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchAllData(); 
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `อัปเดตบิล #${id} เป็น '${nextStatus}'`, showConfirmButton: false, timer: 2000 });
      }
    } catch (error) { console.error("Update failed:", error); }
  };

  // -------------------- FILTER --------------------
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
      <nav className="navbar flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍽️</span>
          <h1 className="text-2xl font-black tracking-tighter">เจ้านายหมูทอด<span className="text-indigo-200"></span></h1>
        </div>
        
        {/* ควบคุมการแสดงปุ่มด้วย Role */}
        <div className="flex bg-black/10 p-1 rounded-2xl backdrop-blur-md">
          <button onClick={() => setViewMode("pos")} className={viewMode === "pos" ? "btn-nav-active" : "btn-nav"}>หน้าร้าน</button>
          
          {/* ซ่อนปุ่มหลังบ้านถ้าเป็นแค่ cashier */}
          {currentUser.role === 'manager' && (
            <button onClick={() => setViewMode("manage")} className={viewMode === "manage" ? "btn-nav-active" : "btn-nav"}>หลังบ้าน</button>
          )}
        </div>

        {/* ข้อมูลโปรไฟล์และปุ่ม Log out */}
        <div className="flex items-center gap-4 border-l-2 pl-4 border-slate-100">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-slate-800">{currentUser.username}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role === 'manager' ? 'ผู้จัดการ' : 'แคชเชียร์'}</p>
          </div>
          <button onClick={handleLogout} className="btn-outline border-none bg-red-50 text-red-500 hover:bg-red-100 px-4 py-2 text-sm font-bold rounded-xl">
            ออกระบบ
          </button>
        </div>
      </nav>

      <main className="p-4 md:p-6">
        {viewMode === "pos" ? (
          <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[calc(100vh-140px)]">
            <div className="panel-card flex-1 flex flex-col overflow-hidden w-full">
              <input type="text" placeholder="🔍 ค้นหาเมนูอาหาร..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field mb-6" />
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 md:px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${filterCategory === cat ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{cat}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pr-2 pb-4">
                {filteredMenus.map((menu) => (
                  <div key={menu.id} onClick={() => handleMenuClick(menu)} className="group menu-item cursor-pointer hover:shadow-xl transition-all p-3 border border-slate-100 rounded-[2rem]">
                    <div className="overflow-hidden rounded-[1.5rem] mb-3 shadow-inner bg-slate-100 relative">
                      <img src={menu.image_url || "https://placehold.co/400x300?text=Food"} alt={menu.name} className="w-full h-24 md:h-36 object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">{menu.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[60%]">{menu.category}</span>
                      <span className="text-indigo-600 font-black text-sm md:text-lg">฿{menu.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card w-full lg:w-[400px] flex flex-col border-t-4 lg:border-t-0 lg:border-l-4 border-indigo-50 mt-4 lg:mt-0">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <span className="text-2xl text-indigo-600">🧾</span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">ORDER BILL</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide min-h-[250px]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                    <span className="text-7xl">🛒</span>
                    <p className="font-black uppercase tracking-widest text-xs">No items selected</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-transparent hover:border-indigo-100 transition-all group">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-700 text-sm">{item.name}</h4>
                        <p className="text-xs font-bold text-slate-400">฿{item.price} x {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-indigo-600 text-sm">฿{item.price * item.qty}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-all text-xl">✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
                <div className="flex justify-between text-2xl md:text-3xl font-black text-slate-900 mb-6 tracking-tighter">
                  <span className="text-slate-400 text-sm self-center uppercase tracking-widest">Grand Total</span>
                  <span>฿{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} disabled={isLoading} className="btn-primary w-full py-4 md:py-5 text-lg md:text-xl disabled:opacity-50">
                  <span>💸</span> {isLoading ? "PROCESSING..." : "CHECKOUT"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="panel-card bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-indigo-200 shadow-2xl">
                <h3 className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2">Total Revenue</h3>
                <p className="text-4xl md:text-5xl font-black tracking-tighter truncate">฿{(Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + Number(o.total_price), 0).toLocaleString()}</p>
              </div>
              <div className="panel-card">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Orders Today</h3>
                <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">{(Array.isArray(orders) ? orders : []).length} <span className="text-lg text-slate-300 ml-2">Bills</span></p>
              </div>
              <div className="panel-card">
                <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Avg. Ticket Size</h3>
                <p className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter">฿{(Array.isArray(orders) ? orders : []).length > 0 ? Math.round((Array.isArray(orders) ? orders : []).reduce((sum, o) => sum + Number(o.total_price), 0) / (Array.isArray(orders) ? orders : []).length).toLocaleString() : 0}</p>
              </div>
            </div>

            <div className="panel-card overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="bg-indigo-100 p-2 rounded-xl text-lg">📜</span> Order History</h2>
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                  <button onClick={() => setOrderFilter("All")} className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "All" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>ทั้งหมด</button>
                  <button onClick={() => setOrderFilter("กำลังทำ")} className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "กำลังทำ" ? "bg-amber-400 text-white shadow-sm" : "text-slate-500"}`}>⏳ กำลังทำ</button>
                  <button onClick={() => setOrderFilter("เสร็จสิ้น")} className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all ${orderFilter === "เสร็จสิ้น" ? "bg-green-500 text-white shadow-sm" : "text-slate-500"}`}>✅ เสร็จสิ้น</button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {filteredOrdersList.length === 0 ? <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest">ไม่มีบิลในหมวดหมู่นี้</p> : 
                 filteredOrdersList.map((order) => (
                  <div key={order.id} className="bg-white border-2 border-slate-50 rounded-3xl overflow-hidden transition-all hover:border-indigo-100 hover:shadow-xl">
                    <div onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="flex flex-col md:flex-row justify-between p-4 md:p-6 cursor-pointer bg-slate-50/50 hover:bg-slate-50 gap-4 md:gap-0">
                      <div className="flex gap-4 md:gap-6 items-center flex-wrap">
                        <span className="font-black text-indigo-600 text-lg">#{order.id}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateOrderStatus(order.id, order.status); }}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transform hover:scale-110 active:scale-95 ${
                            order.status === 'เสร็จสิ้น' ? 'bg-green-500 text-white shadow-lg' : 'bg-amber-400 text-white shadow-lg'
                          }`}
                        >
                          {order.status || 'กำลังทำ'}
                        </button>
                        <span className="text-xs font-bold text-slate-400">{new Date(order.created_at).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
                        <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">฿{Number(order.total_price).toLocaleString()}</span>
                        <span className={`text-slate-300 text-xl transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>
                    {expandedOrderId === order.id && (
                      <div className="p-4 md:p-8 border-t-2 border-dashed border-slate-100 bg-white">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Itemized Receipt</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                          {Array.isArray(order.items) && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                              <span className="text-slate-600 font-bold">{item.name} <span className="text-slate-300 text-[10px] ml-1">x{item.qty}</span></span>
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
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="table-header">
                      <tr><th className="p-4 md:p-6">Menu</th><th className="p-4 md:p-6">Category</th><th className="p-4 md:p-6">Price</th><th className="p-4 md:p-6 text-center">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(Array.isArray(menus) ? menus : []).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4 md:p-6">
                            <div className="flex items-center gap-4">
                              <img src={m.image_url || "https://placehold.co/100"} alt="menu" className="w-10 h-10 md:w-14 md:h-14 rounded-2xl object-cover shadow-md" />
                              <span className="font-bold text-slate-700 text-sm md:text-base">{m.name}</span>
                            </div>
                          </td>
                          <td className="p-4 md:p-6"><span className="category-badge text-[10px] md:text-xs">{m.category}</span></td>
                          <td className="p-4 md:p-6 font-black text-indigo-600">฿{m.price}</td>
                          <td className="p-4 md:p-6 text-center space-x-2 md:space-x-6">
                            <button onClick={() => handleEdit(m)} disabled={isLoading} className="text-amber-500 font-black text-[10px] md:text-xs uppercase hover:text-amber-600 disabled:opacity-50">Edit</button>
                            <button onClick={() => handleDelete(m.id)} disabled={isLoading} className="text-red-400 font-black text-[10px] md:text-xs uppercase hover:text-red-600 disabled:opacity-50">Delete</button>
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
                  <div><label className="input-label">Food Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field w-full" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="input-label">Price (฿)</label><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field w-full" required /></div>
                    <div><label className="input-label">Category</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field w-full" required /></div>
                  </div>
                  <div><label className="input-label">Image URL</label><input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field w-full" placeholder="https://..." /></div>
                  <button type="submit" disabled={isLoading} className={`w-full ${editId ? "btn-primary bg-amber-500 hover:bg-amber-600" : "btn-secondary"} disabled:opacity-50 transition-all`}>
                    {isLoading ? "PROCESSING..." : (editId ? "UPDATE MENU" : "SAVE NEW MENU")}
                  </button>
                  {editId && <button type="button" disabled={isLoading} onClick={() => { setEditId(null); setForm({ name: "", price: "", category: "", image_url: "" }); }} className="w-full text-slate-400 font-bold py-2 mt-2 disabled:opacity-50">Cancel</button>}
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Modal ถามจำนวนอาหารก่อนเข้าตะกร้า --- */}
      {selectedMenu && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl">
            <img src={selectedMenu.image_url || "https://placehold.co/400x300"} className="w-32 h-32 object-cover rounded-3xl mx-auto mb-6 shadow-md border-4 border-slate-50" />
            <h3 className="text-2xl font-black text-slate-800 mb-1">{selectedMenu.name}</h3>
            <p className="text-indigo-600 font-black text-xl mb-8">฿{selectedMenu.price}</p>
            
            <div className="flex items-center justify-center gap-6 mb-10 bg-slate-50 p-4 rounded-3xl w-fit mx-auto border border-slate-100">
              <button onClick={() => setQtyToAdd(Math.max(1, qtyToAdd - 1))} className="w-12 h-12 rounded-2xl bg-white shadow-sm text-slate-600 font-black text-2xl hover:bg-slate-200 transition-all">-</button>
              <span className="text-4xl font-black text-slate-800 w-12">{qtyToAdd}</span>
              <button onClick={() => setQtyToAdd(qtyToAdd + 1)} className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-md text-white font-black text-2xl hover:bg-indigo-700 transition-all">+</button>
            </div>
            
            <div className="flex gap-4">
              <button onClick={confirmAddToCart} className="btn-primary flex-1 py-4 text-lg">เพิ่มลงตะกร้า</button>
              <button onClick={() => setSelectedMenu(null)} className="btn-outline flex-1 py-4 bg-slate-50 text-slate-400 border-none hover:bg-slate-100">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto py-10">
          <div className="bg-white w-full max-w-md rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl my-auto">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">CHECKOUT</h2>
            <p className="text-slate-400 text-sm font-bold mb-6">กรุณาระบุข้อมูลออเดอร์และการชำระเงิน</p>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
              <label className="input-label text-xs">Order Type (ประเภทรายการ)</label>
              <div className="flex gap-2 mt-2 mb-4">
                <button onClick={() => setOrderType("ทานที่ร้าน")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${orderType === "ทานที่ร้าน" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"}`}>🍽️ ทานที่ร้าน</button>
                <button onClick={() => {setOrderType("กลับบ้าน"); setTableNo("");}} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${orderType === "กลับบ้าน" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"}`}>🛍️ กลับบ้าน</button>
              </div>
              
              {orderType === "ทานที่ร้าน" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <input type="text" placeholder="ระบุหมายเลขโต๊ะ (เช่น โต๊ะ 5)" value={tableNo} onChange={(e) => setTableNo(e.target.value)} className="input-field w-full text-center font-bold text-indigo-600" />
                </div>
              )}
            </div>

            <label className="input-label text-xs mb-2 block">Payment Method (วิธีชำระเงิน)</label>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div onClick={() => setPaymentMethod("เงินสด")} className={`p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${paymentMethod === "เงินสด" ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-slate-100 hover:border-slate-200"}`}>
                <span className="text-3xl md:text-4xl">💵</span><span className="font-black text-[10px] md:text-xs uppercase text-slate-700">Cash</span>
              </div>
              <div onClick={() => setPaymentMethod("PromptPay")} className={`p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${paymentMethod === "PromptPay" ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-slate-100 hover:border-slate-200"}`}>
                <span className="text-3xl md:text-4xl">📱</span><span className="font-black text-[10px] md:text-xs uppercase text-slate-700">PromptPay</span>
              </div>
            </div>

            {paymentMethod === "PromptPay" && (
              <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex flex-col items-center border border-slate-100">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPTPAY_${cartTotal}`} alt="QR Code" className="w-24 h-24 md:w-32 md:h-32 mb-4 rounded-xl shadow-sm" />
                <p className="text-indigo-600 font-black text-xl md:text-2xl">฿{cartTotal.toLocaleString()}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button onClick={confirmPayment} disabled={isLoading} className="btn-primary w-full py-4 disabled:opacity-50 text-lg shadow-indigo-200">ยืนยันการสั่งซื้อ</button>
              <button onClick={() => setShowPaymentModal(false)} disabled={isLoading} className="btn-outline w-full border-none bg-slate-50 text-slate-400 py-4 disabled:opacity-50 hover:bg-slate-100">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {showBill && lastBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 print:bg-white print:p-0">
          <div className="bg-white w-full max-w-sm rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl print:shadow-none print:max-w-[80mm] print:m-0 print:p-4">
            <div className="text-center">
              <span className="text-5xl md:text-6xl block mb-4 md:mb-6 print:mb-2 print:text-4xl">🍽️</span>
              <h2 className="text-2xl md:text-3xl font-black mb-2 print:text-xl">เจ้านายหมูทอด</h2>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 print:text-black">Bill #{lastBill.orderId} <br className="hidden print:block"/> {lastBill.date}</p>
              
              <div className="inline-block bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-[10px] mb-6 print:border print:border-black print:bg-white">
                {lastBill.orderType} {lastBill.tableNo && `(โต๊ะ ${lastBill.tableNo})`}
              </div>

              <div className="space-y-3 md:space-y-4 mb-6 border-t-2 border-dashed border-slate-100 pt-6 md:pt-8 print:border-black print:pt-4">
                {lastBill.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-xs md:text-sm font-black print:text-xs">
                    <span className="text-left">{it.name} <span className="text-[10px] text-slate-400 ml-1 print:text-black">x{it.qty}</span></span>
                    <span>฿{(it.price * it.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 pb-6 border-b-2 border-dashed border-slate-100 print:border-black print:mb-4 print:pb-4 print:text-black">
                <span>Payment</span>
                <span className="text-slate-700 print:text-black">{lastBill.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center mb-10 print:mb-6">
                <span className="font-black text-slate-400 uppercase text-xs print:text-black">Total</span>
                <span className="text-3xl md:text-5xl font-black text-indigo-600 print:text-2xl print:text-black">฿{lastBill.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 print:hidden">
              <button onClick={() => window.print()} className="btn-primary flex-1 py-3">PRINT</button>
              <button onClick={() => setShowBill(false)} className="btn-outline flex-1 py-3 border-none bg-slate-50 hover:bg-slate-100">CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}