import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, category, image_url } = body;
    const promisePool = mysqlPool.promise();
    await promisePool.query(
      "UPDATE menus SET name = ?, price = ?, category = ?, image_url = ? WHERE id = ?",
      [name, price, category, image_url, id]
    );
    return NextResponse.json({ message: "Menu updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const promisePool = mysqlPool.promise();
    await promisePool.query("DELETE FROM menus WHERE id = ?", [id]);
    return NextResponse.json({ message: "Menu deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}