"use client";

import { useState, useEffect, useMemo } from "react";
import AdminForm from "./AdminForm";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [archives, setArchives] = useState([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [loadingArchives, setLoadingArchives] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchAllData();
    }
  }, [isAuthorized]);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchCategories(), fetchArchives()]);
    setLoading(false);
  }

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks?type=MASTER");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  async function fetchArchives() {
    try {
      setLoadingArchives(true);
      const res = await fetch("/api/archives");
      const data = await res.json();
      // Sort newest first by date string if possible
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => (a.date < b.date ? 1 : -1))
        : [];
      setArchives(sorted);
    } catch (err) {
      console.error("Error fetching archives:", err);
    } finally {
      setLoadingArchives(false);
    }
  }

  async function handleLogin() {
    if (!password.trim()) {
      alert("Please enter a password");
      return;
    }

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
      });

      if (res.ok) {
        setIsAuthorized(true);
      } else {
        const err = await res.json();
        alert(err.error || "Wrong password");
        setPassword(""); // Clear password on failed attempt
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed");
      setPassword("");
    }
  }

  async function handleDeleteTask(id) {
    if (!confirm("Delete this master task? It will be removed from future days.")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Task deleted successfully");
        fetchTasks(); // Refresh the list
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Something went wrong while deleting the task.");
    }
  }

  async function deployTasksToEmployees() {
    if (
      !confirm(
        "End today, archive all employee task results, and deploy tasks for the next day?"
      )
    ) {
      return;
    }

    // if (!password.trim()) {
    //   alert("Please re‑enter your admin password to run end‑of‑day.");
    //   return;
    // }

    try {
      setDeploying(true);
      const res = await fetch("/api/cron/deploy-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `End‑of‑Day Completed\n\nArchived: ${data.archived} tasks\nDeployed for tomorrow: ${data.count} tasks`
        );
        // Refresh data – archives and tasks may have changed
        fetchTasks();
        fetchArchives();
      } else {
        alert(`Failed: ${data.error || "Failed to deploy tasks"}`);
      }
    } catch (error) {
      console.error("Deploy error:", error);
      alert("Network error while running end‑of‑day");
    } finally {
      setDeploying(false);
    }
  }

  async function handleTaskSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");

    if (!category) {
      alert("Please select a category");
      return;
    }

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: password,
        title,
        description,
        category,
        type: "MASTER",
      }),
    });

    if (res.ok) {
      e.target.reset();
      fetchTasks();
    } else {
      const err = await res.json();
      alert(err.message || "Failed to create task (check password)");
    }
  }

  async function handleCategoryCreate() {
    if (!newCategory.name.trim()) {
      alert("Category name is required");
      return;
    }

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword: password,
        name: newCategory.name,
        description: newCategory.description,
      }),
    });

    if (res.ok) {
      setNewCategory({ name: "", description: "" });
      setShowCategoryForm(false);
      fetchCategories();
    } else {
      const err = await res.json();
      alert(err.message || "Failed to create category");
    }
  }

  async function handleDeleteCategory(id) {
    if (
      !confirm(
        "Delete this category? Any master tasks using it will still exist but will reference a deleted category."
      )
    )
      return;

    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Category deleted successfully");
        fetchCategories();
      } else {
        alert(data.error || "Failed to delete category.");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Something went wrong while deleting the category.");
    }
  }

  // Simple metrics for the header
  const totalMasterTasks = tasks.length;
  const totalCategories = categories.length;
  const totalArchiveDays = archives.length;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border-4 border-amber-900">
          <div className="text-center mb-6">
            <div className="inline-block bg-amber-900 text-amber-50 px-5 py-3 rounded-full mb-3 shadow-lg">
              <span className="text-3xl">🔐</span>
            </div>
            <h2
              className="text-3xl font-bold text-amber-900"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Admin Login
            </h2>
            <p className="text-amber-700 mt-2">
              Williams Cafe – Daily Task Management
            </p>
          </div>
          <label className="block text-sm font-medium text-amber-800 mb-2">
            Admin Password
          </label>
          <input
            type="password"
            placeholder="Enter admin password"
            className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full mb-4 focus:border-amber-500 focus:outline-none bg-amber-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
          />
          <button
            onClick={handleLogin}
            className="bg-amber-900 text-amber-50 w-full py-3 rounded-lg hover:bg-amber-800 transition-colors font-semibold text-lg shadow-md"
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-6">
      {/* Top Bar / Overview */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-amber-900 mb-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Admin Dashboard
            </h1>
            <p className="text-amber-700">
              Control your daily checklist: categories, master tasks, and
              end‑of‑day archives.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={deployTasksToEmployees}
              disabled={deploying}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md text-sm sm:text-base disabled:opacity-70"
            >
              {deploying ? "Running End‑of‑Day..." : "Run End‑of‑Day & Deploy Tomorrow"}
            </button>
            <button
              onClick={() => {
                setIsAuthorized(false);
                setPassword("");
              }}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border-2 border-amber-200 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-amber-500 mb-1">
              Master Task Templates
            </p>
            <p className="text-2xl font-bold text-amber-900">
              {totalMasterTasks}
            </p>
            <p className="text-xs text-amber-700">
              Tasks that repeat every day for employees.
            </p>
          </div>
          <div className="bg-white rounded-xl border-2 border-amber-200 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-amber-500 mb-1">
              Categories
            </p>
            <p className="text-2xl font-bold text-amber-900">
              {totalCategories}
            </p>
            <p className="text-xs text-amber-700">
              Used to group and filter daily tasks.
            </p>
          </div>
          <div className="bg-white rounded-xl border-2 border-amber-200 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-amber-500 mb-1">
              Archived Days (last 7)
            </p>
            <p className="text-2xl font-bold text-amber-900">
              {totalArchiveDays}
            </p>
            <p className="text-xs text-amber-700">
              Snapshots of what was completed each day.
            </p>
          </div>
        </div>

        {loading && (
          <p className="mt-3 text-xs text-amber-600">
            Loading data… This may take a moment.
          </p>
        )}
      </div>

      {/* Main grid: setup + tasks + archives */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)] gap-8">
        <div className="space-y-8">
          {/* Category Management */}
          <section className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
            <header className="flex items-center justify-between mb-2">
              <div>
                <h2
                  className="text-2xl font-bold text-amber-900 flex items-center gap-2"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  <span>🏷️</span> Categories
                </h2>
                <p className="text-xs text-amber-700 mt-1">
                  Set up sections like “Opening”, “Closing”, or “Kitchen” to
                  organize tasks.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="bg-amber-900 text-amber-50 px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors text-xs font-semibold"
              >
                {showCategoryForm ? "Cancel" : "Add Category"}
              </button>
            </header>

            {showCategoryForm && (
              <div className="mb-5 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  Category name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opening, Closing, Bar, Kitchen"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="text-amber-800 border-2 border-amber-300 p-2 rounded-lg w-full mb-3 focus:border-amber-500 focus:outline-none"
                />
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="What kind of tasks belong here?"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  className="text-amber-800 border-2 border-amber-300 p-2 rounded-lg w-full mb-3 focus:border-amber-500 focus:outline-none resize-none"
                  rows={2}
                />
                <button
                  onClick={handleCategoryCreate}
                  className="bg-amber-900 text-amber-50 px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors font-semibold w-full"
                >
                  Save Category
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200 hover:shadow-md transition-shadow relative"
                  >
                    <h3 className="font-bold text-amber-900 mb-1">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-sm text-amber-600 mb-2">
                        {cat.description}
                      </p>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-amber-600 text-center py-4">
                  No categories yet. Create at least one to start organizing
                  tasks.
                </p>
              )}
            </div>
          </section>

          {/* Create new task form */}
          <section className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
            <header className="mb-2">
              <h2
                className="text-2xl font-bold text-amber-900 mb-1 flex items-center gap-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                <span>➕</span> Master Tasks
              </h2>
              <p className="text-xs text-amber-700">
                These are the templates that re‑appear every day for employees.
                Add a task once, and it will repeat daily.
              </p>
            </header>
            <div className="mt-4">
              <AdminForm onSubmit={handleTaskSubmit} categories={categories} />
            </div>
          </section>

          {/* Task list */}
          <section className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
            <header className="mb-3">
              <h2
                className="text-2xl font-bold text-amber-900 flex items-center gap-2 mb-1"
                style={{ fontFamily: "Georgia, serif" }}
              >
                <span>📋</span> Current Master Task List
              </h2>
              <p className="text-xs text-amber-700">
                This list controls what employees see every day. Deleting here
                removes the task from all future days.
              </p>
            </header>

            <ul className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <li
                    key={task._id}
                    className="p-4 bg-amber-50 shadow-md rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-1">☕</span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3
                            className="font-bold text-lg text-amber-900"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {task.title}
                          </h3>
                          {task.category && (
                            <span className="text-xs bg-amber-900 text-amber-50 px-2 py-1 rounded-full">
                              {typeof task.category === "string"
                                ? task.category
                                : task.category?.name || "Unknown"}
                            </span>
                          )}
                        </div>
                        <p className="text-amber-700 text-sm">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 transition-colors shadow-md"
                      >
                        Delete Task
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-amber-600 text-center py-6 bg-amber-50 rounded-lg text-sm">
                  No master tasks yet. Add tasks above to build your daily
                  checklist.
                </p>
              )}
            </ul>
          </section>
        </div>

        {/* Archives Section */}
        <section className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200 h-fit">
          <header className="mb-3">
            <h2
              className="text-2xl font-bold text-amber-900 mb-1 flex items-center gap-2"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span>📚</span> Daily Archives (Last 7 Days)
            </h2>
            <p className="text-xs text-amber-700">
              Each night, all employee task results are saved here by date, then
              automatically deleted after 7 days.
            </p>
          </header>

          {loadingArchives && (
            <p className="text-xs text-amber-600 mb-2">Loading archives…</p>
          )}

          {archives.length > 0 ? (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {archives.map((archive) => (
                <details
                  key={archive._id}
                  className="bg-amber-50 rounded-xl border-2 border-amber-200 overflow-hidden"
                >
                  <summary className="p-3 cursor-pointer hover:bg-amber-100 transition-colors font-semibold text-amber-900 flex items-center justify-between text-sm">
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{archive.date}</span>
                      </span>
                      <span className="text-[11px] text-amber-700">
                        Snapshot of employee results for this day.
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs bg-amber-900 text-amber-50 px-2 py-1 rounded-full">
                        {archive.tasks.length} tasks
                      </span>
                    </span>
                  </summary>

                  <div className="p-3 border-t-2 border-amber-200 space-y-3">
                    {archive.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-amber-200 text-sm"
                      >
                        <div className="flex items-start gap-2 mb-1.5">
                          <span className="mt-[2px]">
                            {task.status === "COMPLETED"
                              ? "✅"
                              : task.status === "INCOMPLETE"
                              ? "⚠️"
                              : "☕"}
                          </span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <h4 className="font-bold text-amber-900">
                                {task.title}
                              </h4>
                              {task.category?.name && (
                                <span className="text-[10px] bg-amber-900 text-amber-50 px-2 py-0.5 rounded-full">
                                  {task.category.name}
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-300 text-amber-700">
                                {task.status}
                              </span>
                            </div>
                            <p className="text-xs text-amber-700 mb-1.5">
                              {task.description}
                            </p>
                            <div className="space-y-0.5">
                              {task.initials && (
                                <p className="text-[11px] text-amber-700">
                                  <span className="font-semibold">Initials:</span>{" "}
                                  {task.initials}
                                </p>
                              )}
                              {task.notes && (
                                <p className="text-[11px] text-amber-700">
                                  <span className="font-semibold">Notes:</span>{" "}
                                  {task.notes}
                                </p>
                              )}
                            </div>
                            {task.photos?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[11px] text-amber-700 font-semibold mb-1">
                                  📸 Photos
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {task.photos.map((photoUrl, i) => (
                                    <a
                                      key={i}
                                      href={photoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block group"
                                    >
                                      <img
                                        src={photoUrl}
                                        alt={`Task photo ${i + 1}`}
                                        className="rounded-md border border-amber-200 shadow-sm hover:shadow-md transition-transform transform group-hover:scale-[1.02]"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-amber-600 text-center py-6 bg-amber-50 rounded-lg text-sm">
              No archived days yet. After the first end‑of‑day run, you’ll see
              results here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}