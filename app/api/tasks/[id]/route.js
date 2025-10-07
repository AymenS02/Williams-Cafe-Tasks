import { connectDB } from "@/lib/config/db";
import Task from "@/lib/models/taskSchema";

export async function PATCH(req, { params }) {
  const { id } = params;
  const { initials, photos } = await req.json();

  await connectDB();

  const task = await Task.findById(id);
  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
  }

  task.initials = initials;
  task.photos = photos;
  task.status = "COMPLETED";
  await task.save();

  return Response.json(task);
}
