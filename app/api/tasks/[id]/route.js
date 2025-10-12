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

  // Automatically delete this submission after 30s
  setTimeout(async () => {
    // Clear only the employee-related fields
    const tempTask = await Task.findById(id);
    if (tempTask) {
      tempTask.initials = undefined;
      tempTask.notes = undefined;
      tempTask.photos = [];
      tempTask.status = "PENDING";
      await tempTask.save();
      console.log(`Cleared submission for task ${id}`);

      // Repost the task for employees (optional: create a new copy)
      setTimeout(async () => {
        const originalTask = await Task.findById(id).populate('category');
        if (originalTask) {
          const repostedTask = await Task.create({
            title: originalTask.title,
            description: originalTask.description,
            category: originalTask.category._id, // ✅ Include category
            type: "EMPLOYEE_COPY"
          });
          console.log(`Reposted task: ${repostedTask._id}`);
        }
      }, 30000); // 30s after deletion
    }
  }, 30000); // 30s after submission

  return new Response(JSON.stringify(task), { status: 200 });
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