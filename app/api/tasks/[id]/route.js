import { connectDB } from "@/lib/config/db";
import Task from "@/lib/models/taskSchema";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { initials, notes, photos } = await req.json();

  await connectDB();

  const task = await Task.findById(id);
  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
  }

  task.initials = initials;
  task.notes = notes;
  task.photos = photos;
  task.status = "COMPLETED";
  await task.save();

  return new Response(JSON.stringify(task), { status: 200 });
}
