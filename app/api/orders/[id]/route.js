import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

// อัปเดตสถานะออเดอร์
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    const promisePool = mysqlPool.promise();
    await promisePool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );
    
    return NextResponse.json({ message: "Order status updated" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}