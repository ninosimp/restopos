export const dynamic = 'force-dynamic'; 

import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function GET() {
  try {
    const promisePool = mysqlPool.promise();
    // ดึงออเดอร์ทั้งหมด
    const [orders] = await promisePool.query("SELECT * FROM orders ORDER BY created_at DESC");
    // ดึงรายละเอียดรายการอาหารทั้งหมด
    const [items] = await promisePool.query("SELECT * FROM order_items");

    // นำรายการอาหารไปใส่ไว้ในแต่ละออเดอร์ที่เกี่ยวข้อง
    const detailedOrders = orders.map(order => ({
      ...order,
      items: items.filter(item => item.order_id === order.id)
    }));

    return NextResponse.json(detailedOrders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// แก้ไขเฉพาะส่วน POST ในไฟล์ app/api/orders/route.js
export async function POST(request) {
  const connection = await mysqlPool.promise().getConnection();
  try {
    const body = await request.json();
    const { total_price, items, payment_method } = body; // รับ payment_method มาด้วย

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      "INSERT INTO orders (total_price, payment_method) VALUES (?, ?)",
      [total_price, payment_method]
    );
    const newOrderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (order_id, menu_name, qty, price) VALUES (?, ?, ?, ?)",
        [newOrderId, item.name, item.qty, item.price]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: "Success" }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
