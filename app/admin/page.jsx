"use client";

import { useState, useEffect } from "react";
import AdminForm from "./AdminForm";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [archives, setArchives] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  useEffect(() => {
    if (isAuthorized) {
      fetchTasks();
      fetchCategories();
      fetchArchives();
    }
  }, [isAuthorized]);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks?type=MASTER");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  }

  async function handleLogin() {
  try {
    // Test the password by trying to fetch tasks
    const res = await fetch("/api/tasks?type=MASTER", {
      headers: {
        "Authorization": `Bearer ${password}`
      }
    });
    
    if (res.ok) {
      setIsAuthorized(true);
    } else {
      alert("Wrong password");
    }
  } catch (error) {
    alert("Login failed");
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
      const res = await fetch("/api/archives");
      const data = await res.json();
      setArchives(data);
    } catch (err) {
      console.error("Error fetching archives:", err);
    }
  }

  async function handleDeleteTask(id) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Task deleted successfully!");
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
    if (!confirm("Deploy all master tasks to employees? This will create employee copies.")) {
      return;
    }

    try {
      const res = await fetch("/api/cron/deploy-tasks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminPassword: password }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ Deployed ${data.count} tasks to employees!\nArchived: ${data.archived} tasks`);
      } else {
        const err = await res.json();
        alert(`❌ ${err.error || "Failed to deploy tasks"}`);
      }
    } catch (error) {
      console.error("Deploy error:", error);
      alert("❌ Network error while deploying tasks");
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
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Category deleted successfully!");
        fetchCategories();
      } else {
        alert(data.error || "Failed to delete category.");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Something went wrong while deleting the category.");
    }
  }


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
            <p className="text-amber-700 mt-2">Williams Cafe Management</p>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full mb-4 focus:border-amber-500 focus:outline-none bg-amber-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="bg-amber-900 text-amber-50 w-full py-3 rounded-lg hover:bg-amber-800 transition-colors font-semibold text-lg shadow-md"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <div className="inline-block bg-amber-900 text-amber-50 px-6 py-3 rounded-full mb-4 shadow-lg">
          <span className="text-2xl">⚙️</span>
        </div>
        <h1
          className="text-4xl font-bold text-amber-900 mb-2"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Admin Dashboard
        </h1>
        <p className="text-amber-700 text-lg">
          Williams Cafe Task Management
        </p>
        <button
          onClick={deployTasksToEmployees}
          className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg"
        >
          🚀 Deploy Tasks to Employees
        </button>
      </div>

      {/* Category Management */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-2xl font-bold text-amber-900 flex items-center gap-2"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span>🏷️</span> Categories
            </h2>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="bg-amber-900 text-amber-50 px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors text-sm font-semibold"
            >
              {showCategoryForm ? "Cancel" : "+ New Category"}
            </button>
          </div>

          {showCategoryForm && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
              <input
                type="text"
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full mb-3 focus:border-amber-500 focus:outline-none"
              />
              <textarea
                placeholder="Category description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full mb-3 focus:border-amber-500 focus:outline-none resize-none"
                rows="2"
              />
              <button
                onClick={handleCategoryCreate}
                className="bg-amber-900 text-amber-50 px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors font-semibold w-full"
              >
                Create Category
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200 hover:shadow-md transition-shadow relative"
                >
                  <h3 className="font-bold text-amber-900 mb-1">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-amber-600 mb-2">{cat.description}</p>
                  )}
                  <button
                    onClick={() => handleDeleteCategory(cat._id)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-amber-600 text-center py-4">
                No categories yet. Create one above!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Create new task form */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
          <h2
            className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <span>➕</span> Create New Task
          </h2>
          <AdminForm onSubmit={handleTaskSubmit} categories={categories} />
        </div>
      </div>

      {/* Task list */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
          <h2
            className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <span>📋</span> Active Master Tasks
          </h2>

          <ul className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <li
                  key={task._id}
                  className="p-5 bg-amber-50 shadow-md rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">☕</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className="font-bold text-xl text-amber-900"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {task.title}
                        </h3>
                        {task.category && (
                          <span className="text-xs bg-amber-900 text-amber-50 px-2 py-1 rounded-full">
                            {typeof task.category === "string"
                              ? task.category
                              : (task.category && task.category.name)
                                ? task.category.name
                                : "Unknown"}
                          </span>
                        )}
                      </div>
                      <p className="text-amber-700 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors shadow-md"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-amber-600 text-center py-8 bg-amber-50 rounded-lg">
                No tasks yet. Create your first task above!
              </p>
            )}
          </ul>
        </div>
      </div>

      {/* Archives Section */}
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
          <h2
            className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <span>📚</span> Task Archives (Auto-delete after 7 days)
          </h2>

          {archives.length > 0 ? (
            <div className="space-y-4">
              {archives.map((archive) => (
                <details
                  key={archive._id}
                  className="bg-amber-50 rounded-xl border-2 border-amber-200 overflow-hidden"
                >
                  <summary className="p-4 cursor-pointer hover:bg-amber-100 transition-colors font-semibold text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>📅</span>
                      {archive.date}
                    </span>
                    <span className="text-sm bg-amber-900 text-amber-50 px-3 py-1 rounded-full">
                      {archive.tasks.length} tasks
                    </span>
                  </summary>
                  
                  <div className="p-4 border-t-2 border-amber-200 space-y-3">
                    {archive.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-lg border border-amber-200"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span>
                            {task.status === "COMPLETED" ? "✅" : 
                             task.status === "INCOMPLETE" ? "⚠️" : "☕"}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-amber-900">{task.title}</h4>
                              {task.category?.name && (
                                <span className="text-xs bg-amber-900 text-amber-50 px-2 py-1 rounded-full">
                                  {task.category.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-amber-700 mb-2">{task.description}</p>
                            {task.initials && (
                              <p className="text-sm text-amber-600">
                                <strong>By:</strong> {task.initials}
                              </p>
                            )}
                            {task.notes && (
                              <p className="text-sm text-amber-600">
                                <strong>Notes:</strong> {task.notes}
                              </p>
                            )}
                            {task.photos?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-amber-700 font-semibold mb-2">📸 Attached Photos:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                                        className="rounded-lg border border-amber-200 shadow-sm hover:shadow-md transition-transform transform group-hover:scale-[1.02]"
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
            <p className="text-amber-600 text-center py-8 bg-amber-50 rounded-lg">
              No archived tasks yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}