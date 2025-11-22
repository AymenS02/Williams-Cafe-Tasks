import { connectDB } from "@/lib/config/db";
import { Task, Archive } from "@/lib/models/taskSchema";

async function deployTasks() {
  console.log("[CRON] Running task deployment...");

  try {
    await connectDB();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get all EMPLOYEE_COPY tasks to archive (today's active tasks)
    const employeeTasks = await Task.find({ type: "EMPLOYEE_COPY" })
      .populate("category")
      .limit(1000); // Add limit for safety

    console.log(
      "[CRON] Found",
      employeeTasks.length,
      "employee tasks to consider for archiving",
    );

    if (employeeTasks.length > 0) {
      // Archive ALL tasks (including PENDING) so admin can see which were not completed
      const tasksToArchive = employeeTasks.map((task) => ({
        title: task.title,
        description: task.description,
        category: task.category?._id,
        initials: task.initials,
        notes: task.notes,
        photos: task.photos,
        status: task.status, // "PENDING", "COMPLETED", or "INCOMPLETE"
        completedAt: task.dateCompleted || task.updatedAt, // Use completion timestamp if available
      }));

      console.log(
        "[CRON] Tasks to archive for",
        today,
        ":",
        tasksToArchive.length,
      );

      if (tasksToArchive.length > 0) {
        // Find or create archive for today
        let archive = await Archive.findOne({ date: today });

        if (archive) {
          // Append to existing archive
          archive.tasks.push(...tasksToArchive);
          await archive.save();
          console.log(
            `[CRON] Added ${tasksToArchive.length} tasks to existing archive for ${today}`,
          );
        } else {
          // Create new archive
          archive = await Archive.create({
            date: today,
            tasks: tasksToArchive,
          });
          console.log(
            `[CRON] Created new archive for ${today} with ${tasksToArchive.length} tasks`,
          );
        }
      }
    } else {
      console.log("[CRON] No EMPLOYEE_COPY tasks found to archive");
    }

    // Delete all existing EMPLOYEE_COPY tasks (fresh start for next day)
    const deleted = await Task.deleteMany({ type: "EMPLOYEE_COPY" });
    console.log(`[CRON] Deleted ${deleted.deletedCount} old employee tasks`);

    // Get all MASTER tasks
    const masterTasks = await Task.find({ type: "MASTER" }).limit(1000); // Add limit for safety

    if (masterTasks.length === 0) {
      console.log("[CRON] No master tasks to deploy");
      return {
        message: "No master tasks to deploy",
        count: 0,
        archived: employeeTasks.length,
      };
    }

    // Create EMPLOYEE_COPY for each MASTER task
    const newEmployeeTasks = masterTasks.map((task) => ({
      title: task.title,
      description: task.description,
      category: task.category,
      type: "EMPLOYEE_COPY",
      status: "PENDING",
    }));

    const createdTasks = await Task.insertMany(newEmployeeTasks);

    console.log(
      `[CRON] Deployed ${createdTasks.length} tasks at ${new Date().toISOString()}`,
    );

    return {
      success: true,
      message: "Tasks deployed successfully",
      count: createdTasks.length,
      archived: employeeTasks.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[CRON] Error deploying tasks:", error);
    throw error;
  }
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("user-agent")?.includes("vercel-cron");
  const hasValidSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !hasValidSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const result = await deployTasks();
    return Response.json(result);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to deploy tasks",
        details: error.message,
      }),
      { status: 500 },
    );
  }
}

// Manual trigger for admin (with password protection)
export async function POST(req) {
  try {
    
    const { adminPassword } = await req.json();

    // Check if password matches
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      console.log("admin1", adminPassword, "admin2",process.env.ADMIN_PASSWORD);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid password" }),
        { status: 403 },
      );
    }

    // If password is correct, deploy tasks
    const result = await deployTasks();
    return Response.json(result);
  } catch (error) {
    console.error("[POST] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to deploy tasks",
        details: error.message,
      }),
      { status: 500 },
    );
  }
}