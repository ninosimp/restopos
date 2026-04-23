import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; 
    const body = await req.json();
    const { status } = body;

    console.log("Updating Order ID:", id, "New Status:", status); // เช็คใน Vercel Logs ได้

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "ไม่พบออเดอร์ หรือสถานะซ้ำเดิม" }, { status: 404 });
    }

    return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}