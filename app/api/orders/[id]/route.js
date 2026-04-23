import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; 
    const body = await req.json();
    
    // ดึงค่า status ออกมา ถ้าไม่มีให้เป็น 'เสร็จสิ้น' ไปเลย (หรือค่าที่คุณต้องการ)
    const newStatus = body.status || 'เสร็จสิ้น';

    if (!id) {
      return NextResponse.json({ error: "ไม่พบรหัสออเดอร์" }, { status: 400 });
    }

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [newStatus, id]
    );

    return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}