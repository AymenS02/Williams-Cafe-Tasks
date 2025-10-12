// app/api/categories/route.js

import { connectDB } from "@/lib/config/db";
import { Category, Task } from "@/lib/models/taskSchema";

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

  const existingCategory = await Category.findOne({ name: name.trim() });
  if (existingCategory) {
    return new Response(JSON.stringify({ error: "Category already exists" }), { status: 400 });
  }

  const newCategory = await Category.create({
    name: name.trim(),
    description: description?.trim(),
  });

  return Response.json(newCategory);
}

export async function DELETE(req) {
  const { id, adminPassword } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: "Category ID is required" }), { status: 400 });
  }

  await connectDB();

  // Check if category has tasks
  const taskCount = await Task.countDocuments({ category: id });
  if (taskCount > 0) {
    return new Response(
      JSON.stringify({
        error: `This category has ${taskCount} task(s). Please delete or reassign them first.`,
      }),
      { status: 400 }
    );
  }

  await Category.findByIdAndDelete(id);

  return new Response(JSON.stringify({ message: "Category deleted successfully." }), { status: 200 });
}
