export const dynamic = 'force-dynamic'; 
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

// --- ฟังก์ชันดึงข้อมูล (GET) ---
export async function GET() {
  try {
    const [rows] = await mysqlPool.query("SELECT * FROM menus ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
  }
}

// --- ฟังก์ชันเพิ่มข้อมูล (POST) ---
// ... โค้ดส่วนอื่นๆ ...
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, price, category, image_url } = body;
    
    if (!name || !price) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและราคา" }, { status: 400 });
    }

    // จุดสำคัญ: ต้องแน่ใจว่าตารางชื่อ menus และมีคอลัมน์ name, price, category, image_url
    const [result] = await mysqlPool.execute(
      "INSERT INTO menus (name, price, category, image_url) VALUES (?, ?, ?, ?)",
      [name, Number(price), category || 'ทั่วไป', image_url || '']
    );

    return NextResponse.json({ message: "เพิ่มเมนูสำเร็จ", id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    // ส่ง Error จริงๆ กลับมาให้หน้าเว็บ จะได้รู้ว่า TiDB ด่าว่าอะไร
    return NextResponse.json({ error: error.message || "บันทึกข้อมูลล้มเหลว" }, { status: 500 });
  }
}