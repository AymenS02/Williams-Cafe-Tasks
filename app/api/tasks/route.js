// app/api/tasks/route.js

import { connectDB } from "@/lib/config/db";
import { Task } from "@/lib/models/taskSchema";

export async function GET(req) {
  await connectDB();
  
  // Get query params
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  // Filter by type if provided (MASTER or EMPLOYEE_COPY)
  const filter = type ? { type } : {};
  
  const tasks = await Task.find(filter)
    .populate('category', 'name description')
    .sort({ createdAt: -1 });
  
  return Response.json(tasks);
}

export async function POST(req) {
  const { adminPassword, title, description, category, type } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  if (!category) {
    return new Response(JSON.stringify({ error: "Category is required" }), { status: 400 });
  }

  await connectDB();
  const newTask = await Task.create({ 
    title, 
    description, 
    category,
    type: type || "MASTER" // default to MASTER for admin-created tasks
  });

  return Response.json(newTask);
}

