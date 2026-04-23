import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; 
    const body = await req.json();
    
    // ตรวจสอบว่า id เป็นตัวเลขหรือไม่ และไม่ใช่คำว่า 'undefined'
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }

    const statusValue = body.status !== undefined ? body.status : 'เสร็จสิ้น';

    const [result] = await mysqlPool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [statusValue, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: `Order #${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}