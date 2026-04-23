export const dynamic = 'force-dynamic'; 
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function GET() {
  try {
    // ลบ .promise() ออกไปแล้ว
    const [rows] = await mysqlPool.query("SELECT * FROM menus ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, price, category, image_url } = body;
    
    if (!name || !price) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและราคา" }, { status: 400 });
    }

    // ลบ .promise() ออกไปแล้ว
    const [result] = await mysqlPool.execute(
      "INSERT INTO menus (name, price, category, image_url) VALUES (?, ?, ?, ?)",
      [name, Number(price), category || 'ทั่วไป', image_url || '']
    );

    return NextResponse.json({ message: "เพิ่มเมนูสำเร็จ", id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}