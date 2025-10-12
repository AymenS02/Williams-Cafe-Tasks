// app/api/cron/deploy-tasks/route.js

import { connectDB } from "@/lib/config/db";
import { Task, Archive } from "@/lib/models/taskSchema";

export async function GET(req) {
  // FOR TESTING: Allow all requests (disable auth)
  // TODO: Re-enable auth for production by uncommenting below
  
  /*
  const authHeader = req.headers.get('authorization');
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron');
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isVercelCron && !hasValidSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  */

  console.log('[CRON] Running task deployment...');

  try {
    await connectDB();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get all EMPLOYEE_COPY tasks to archive
    const employeeTasks = await Task.find({ type: "EMPLOYEE_COPY" }).populate('category');

    // Archive tasks if there are any
    if (employeeTasks.length > 0) {
      // Filter only completed/incomplete tasks (skip pending)
      const tasksToArchive = employeeTasks
        .filter(task => task.status !== "PENDING")
        .map(task => ({
          title: task.title,
          description: task.description,
          category: task.category?._id,
          initials: task.initials,
          notes: task.notes,
          photos: task.photos,
          status: task.status,
          completedAt: task.updatedAt,
        }));

      if (tasksToArchive.length > 0) {
        // Find or create archive for today
        let archive = await Archive.findOne({ date: today });
        
        if (archive) {
          // Append to existing archive
          archive.tasks.push(...tasksToArchive);
          await archive.save();
          console.log(`[CRON] Added ${tasksToArchive.length} tasks to existing archive for ${today}`);
        } else {
          // Create new archive
          archive = await Archive.create({
            date: today,
            tasks: tasksToArchive,
          });
          console.log(`[CRON] Created new archive for ${today} with ${tasksToArchive.length} tasks`);
        }
      }
    }

    // Delete all existing EMPLOYEE_COPY tasks (fresh start)
    const deleted = await Task.deleteMany({ type: "EMPLOYEE_COPY" });
    console.log(`[CRON] Deleted ${deleted.deletedCount} old employee tasks`);

    // Get all MASTER tasks
    const masterTasks = await Task.find({ type: "MASTER" });

    if (masterTasks.length === 0) {
      console.log('[CRON] No master tasks to deploy');
      return Response.json({ 
        message: "No master tasks to deploy", 
        count: 0,
        archived: employeeTasks.length
      });
    }

    // Create EMPLOYEE_COPY for each MASTER task
    const newEmployeeTasks = masterTasks.map(task => ({
      title: task.title,
      description: task.description,
      category: task.category,
      type: "EMPLOYEE_COPY",
      status: "PENDING",
    }));

    const createdTasks = await Task.insertMany(newEmployeeTasks);

    console.log(`[CRON] Deployed ${createdTasks.length} tasks at ${new Date().toISOString()}`);

    return Response.json({ 
      success: true,
      message: "Tasks deployed successfully", 
      count: createdTasks.length,
      archived: employeeTasks.filter(t => t.status !== "PENDING").length,
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

// Manual trigger for admin (with password protection)
export async function POST(req) {
  const { adminPassword } = await req.json();

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  // Reuse the GET logic
  return GET(req);
}