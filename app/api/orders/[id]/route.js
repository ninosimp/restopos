import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; 
    const body = await req.json();
    
    // ดึงค่า status ออกมา ถ้าไม่มีค่าให้เป็น null (SQL จะยอมรับ)
    const status = body.status !== undefined ? body.status : null;

    if (!id || status === null) {
      return NextResponse.json({ error: "ข้อมูล ID หรือ Status ไม่ถูกต้อง" }, { status: 400 });
    }

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบออเดอร์ที่ระบุ" }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตสำเร็จ" });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}