// app/api/cron/deploy-tasks/route.js

import { connectDB } from "@/lib/config/db";
import { Task } from "@/lib/models/taskSchema";

export async function GET(req) {
  // Vercel Cron jobs automatically include a secret header
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization');
  
  // Check if it's from Vercel Cron OR has the correct secret
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isVercelCron && !hasValidSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    await connectDB();

    // Get all MASTER tasks
    const masterTasks = await Task.find({ type: "MASTER" });

    if (masterTasks.length === 0) {
      return Response.json({ 
        message: "No master tasks to deploy", 
        count: 0 
      });
    }

    // Delete all existing EMPLOYEE_COPY tasks (fresh start each day)
    await Task.deleteMany({ type: "EMPLOYEE_COPY" });

    // Create EMPLOYEE_COPY for each MASTER task
    const employeeTasks = masterTasks.map(task => ({
      title: task.title,
      description: task.description,
      category: task.category,
      type: "EMPLOYEE_COPY",
      status: "PENDING",
    }));

    const createdTasks = await Task.insertMany(employeeTasks);

    console.log(`[CRON] Deployed ${createdTasks.length} tasks at ${new Date().toISOString()}`);

    return Response.json({ 
      success: true,
      message: "Tasks deployed successfully", 
      count: createdTasks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[CRON] Error deploying tasks:", error);
    return new Response(
      JSON.stringify({ error: "Failed to deploy tasks", details: error.message }), 
      { status: 500 }
    );
  }
}

// Optional: Manual trigger for testing (protected by admin password)
export async function POST(req) {
  const { adminPassword } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  // Reuse the same logic
  return GET(req);
}