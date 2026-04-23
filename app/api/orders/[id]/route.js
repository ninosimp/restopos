import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; // ดึง ID ออเดอร์จาก URL
    const body = await req.json();
    const { status } = body; // รับค่าสถานะใหม่ เช่น 'เสร็จสิ้น'

    if (!status) {
      return NextResponse.json({ error: "กรุณาระบุสถานะ" }, { status: 400 });
    }

    // อัปเดตข้อมูลใน TiDB
    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบออเดอร์ที่ระบุ" }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}