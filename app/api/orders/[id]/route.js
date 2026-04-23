import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; 
    const body = await req.json();
    
    // ป้องกัน undefined: ถ้าไม่มีค่า status ส่งมา ให้เป็น 'เสร็จสิ้น' หรือ null
    const statusValue = body.status !== undefined ? body.status : 'เสร็จสิ้น';

    if (!id) {
      return NextResponse.json({ error: "ไม่พบ ID ออเดอร์" }, { status: 400 });
    }

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [statusValue, id] // มั่นใจว่า statusValue ไม่เป็น undefined แน่นอน
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลในระบบ" }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}