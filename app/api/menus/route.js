import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function GET() {
  try {
    const promisePool = mysqlPool.promise();
    const [rows] = await promisePool.query("SELECT * FROM menus");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, price, category, image_url } = body;
    const promisePool = mysqlPool.promise();
    await promisePool.query(
      "INSERT INTO menus (name, price, category, image_url) VALUES (?, ?, ?, ?)",
      [name, price, category, image_url]
    );
    return NextResponse.json({ message: "Menu created successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}