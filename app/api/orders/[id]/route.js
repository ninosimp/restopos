import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; 
    const body = await req.json();
    const newStatus = body.status || 'เสร็จสิ้น';

    console.log(`Attempting to update Order ID: ${id} to Status: ${newStatus}`);

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [newStatus, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: `ไม่พบออเดอร์ ID: ${id}` }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตสถานะเรียบร้อย" });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}