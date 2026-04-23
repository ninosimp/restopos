import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    // ดึง id จาก URL (Next.js Dynamic Route)
    const { id } = params; 
    const body = await req.json();
    const newStatus = body.status || 'เสร็จสิ้น';

    if (!id) return NextResponse.json({ error: "ไม่พบ ID ในคำขอ" }, { status: 400 });

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [newStatus, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: `ไม่พบรหัสออเดอร์ #${id} ในฐานข้อมูล` }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}