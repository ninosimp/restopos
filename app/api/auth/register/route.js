import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password, role } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

    // เข้ารหัสผ่านก่อนลง DB
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'cashier';

    await mysqlPool.execute(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, userRole]
    );

    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ error: "มีชื่อผู้ใช้นี้ในระบบแล้ว" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}