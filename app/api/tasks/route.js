import { connectDB } from "@/lib/config/db";
import Task from "@/lib/models/taskSchema";

export async function GET() {
  await connectDB();
  const tasks = await Task.find().sort({ createdAt: -1 });
  return Response.json(tasks);
}

export async function POST(req) {
  const { adminPassword, title, description } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  await connectDB();
  const newTask = await Task.create({ title, description });

  return Response.json(newTask);
}