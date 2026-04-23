import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

// ==========================================
// 1. ฟังก์ชันสำหรับ "แก้ไข" เมนูอาหาร (PUT)
// ==========================================
export async function PUT(req, context) {
  try {
    // แก้บั๊ก Next.js 15 ด้วยการใส่ await หน้า context.params
    const params = await context.params;
    const id = params.id;
    
    const body = await req.json();
    const { name, price, category, image_url } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // ใช้ mysqlPool.execute ได้เลย ไม่ต้องมี .promise()
    const [result] = await mysqlPool.execute(
      "UPDATE menus SET name = ?, price = ?, category = ?, image_url = ? WHERE id = ?",
      [name, price, category, image_url, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบเมนูที่ต้องการแก้ไข" }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตเมนูสำเร็จ" });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 2. ฟังก์ชันสำหรับ "ลบ" เมนูอาหาร (DELETE)
// ==========================================
export async function DELETE(req, context) {
  try {
    // แก้บั๊ก Next.js 15 ด้วยการใส่ await หน้า context.params
    const params = await context.params;
    const id = params.id;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // ใช้ mysqlPool.execute ได้เลย ไม่ต้องมี .promise()
    const [result] = await mysqlPool.execute(
      "DELETE FROM menus WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบเมนูที่ต้องการลบ" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบเมนูสำเร็จ" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}