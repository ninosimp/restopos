import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    
    // ค้นหาผู้ใช้จาก DB
    const [rows] = await mysqlPool.execute("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return NextResponse.json({ error: "ไม่พบชื่อผู้ใช้งานนี้" }, { status: 404 });

    const user = rows[0];
    
    // เทียบรหัสผ่านที่กรอก กับที่เข้ารหัสไว้ใน DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });

    return NextResponse.json({ 
      message: "เข้าสู่ระบบสำเร็จ", 
      user: { id: user.id, username: user.username, role: user.role } 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}