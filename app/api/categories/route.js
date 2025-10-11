// app/api/categories/route.js (NEW FILE)

import { connectDB } from "@/lib/config/db";
import { Category } from "@/lib/models/taskSchema";

export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ createdAt: -1 });
  return Response.json(categories);
}

export async function POST(req) {
  const { adminPassword, name, description } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  if (!name || !name.trim()) {
    return new Response(JSON.stringify({ error: "Category name is required" }), { status: 400 });
  }

  await connectDB();

  // Check if category already exists
  const existingCategory = await Category.findOne({ name: name.trim() });
  if (existingCategory) {
    return new Response(JSON.stringify({ error: "Category already exists" }), { status: 400 });
  }

  const newCategory = await Category.create({ 
    name: name.trim(), 
    description: description?.trim() 
  });

  return Response.json(newCategory);
}