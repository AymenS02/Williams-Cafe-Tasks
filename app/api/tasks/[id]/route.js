// app/api/tasks/[id]/route.js

import { connectDB } from "@/lib/config/db";
import { Task } from "@/lib/models/taskSchema";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { initials, notes, photos, status } = await req.json();

  await connectDB();

  const task = await Task.findById(id);
  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
  }

  // Update employee submission
  task.initials = initials;
  task.notes = notes;
  task.photos = photos;
  task.status = status;
  await task.save();

  return new Response(JSON.stringify(task), { status: 200 });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const { action } = await req.json();

  await connectDB();

  const task = await Task.findById(id);
  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
  }

  if (action === "undo") {
    // Reset task to pending status
    task.initials = undefined;
    task.notes = undefined;
    task.photos = [];
    task.status = "PENDING";
    await task.save();

    console.log(`Task ${id} reset to pending status`);
    return new Response(JSON.stringify({ message: "Task reset to pending", task }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  await connectDB();

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });
    }

    console.log(`Task deleted: ${id}`);
    return new Response(JSON.stringify({ message: "Task deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return new Response(JSON.stringify({ error: "Failed to delete task" }), { status: 500 });
  }
}