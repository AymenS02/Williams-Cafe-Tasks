// app/api/archives/route.js

import { connectDB } from "@/lib/config/db";
import { Archive } from "@/lib/models/taskSchema";

export async function GET(req) {
  await connectDB();
  
  // Get archives sorted by date (newest first)
  const archives = await Archive.find()
    .populate('tasks.category', 'name')
    .sort({ date: -1 });
  
  return Response.json(archives);
}