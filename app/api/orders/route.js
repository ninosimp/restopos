export const dynamic = 'force-dynamic'; 
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await mysqlPool.query("SELECT * FROM orders ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET Orders Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { total_price, items, payment_method } = body;
    
    const [result] = await mysqlPool.execute(
      "INSERT INTO orders (total_price, items, payment_method) VALUES (?, ?, ?)",
      [Number(total_price), JSON.stringify(items), payment_method || 'เงินสด']
    );

    return NextResponse.json({ message: "บันทึกบิลสำเร็จ", id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("POST Orders Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}