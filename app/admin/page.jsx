"use client";

import { useState, useEffect } from "react";
import AdminForm from "./AdminForm";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  useEffect(() => {
    if (isAuthorized) {
      fetchTasks();
      fetchCategories();
    }
  }, [isAuthorized]);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks?type=MASTER");
      const data = await res.json();
      setTasks(data);
      console.log(data);
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
            onClick={() => {
              if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD)
                setIsAuthorized(true);
              else alert("Wrong password");
            }}
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
                  className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-bold text-amber-900 mb-1">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-amber-600">{cat.description}</p>
                  )}
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
    </div>
  );
}