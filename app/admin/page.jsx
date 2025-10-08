"use client";

import { useState, useEffect } from "react";
import AdminForm from "./AdminForm";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (isAuthorized) fetchTasks();
  }, [isAuthorized]);

  async function fetchTasks() {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get("title");
    const description = formData.get("description");

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: password, title, description }),
    });

    if (res.ok) {
      e.target.reset();
      fetchTasks();
    } else {
      alert("Failed to create task (check password)");
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
            <h2 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
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
        <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Admin Dashboard
        </h1>
        <p className="text-amber-700 text-lg">Williams Cafe Task Management</p>
      </div>

      {/* Create new task form */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
          <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
            <span>➕</span> Create New Task
          </h2>
          <AdminForm onSubmit={handleSubmit} />
        </div>
      </div>

      {/* Task list */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200">
          <h2
            className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <span>📋</span> Current Tasks
          </h2>

          <ul className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <li
                  key={task._id}
                  className="p-5 bg-amber-50 shadow-md rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">
                      {task.status === "COMPLETED" ? "✅" : "☕"}
                    </span>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-xl text-amber-900 mb-1"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {task.title}
                      </h3>
                      <p className="text-amber-700 leading-relaxed">
                        {task.description}
                      </p>

                      {/* ✅ Show completion info */}
                      {task.status === "COMPLETED" && (
                        <div className="mt-3 space-y-2">
                          <div className="inline-block bg-green-100 border border-green-500 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                            Completed by {task.initials}
                          </div>

                          {/* 🗒️ Notes */}
                          <p className="text-amber-800 bg-white border border-amber-300 rounded-lg p-3 text-sm shadow-sm">
                            <strong>Notes:</strong>{" "}
                            {task.notes ? task.notes : "No notes provided."}
                          </p>

                          {/* 🖼️ Photos */}
                          {task.photos?.length > 0 && (
                            <details className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                              <summary className="cursor-pointer text-amber-800 font-semibold">
                                📷 View {task.photos.length} Photo
                                {task.photos.length > 1 ? "s" : ""}
                              </summary>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                {task.photos.map((photo, i) => (
                                  <img
                                    key={i}
                                    src={photo}
                                    alt={`Task ${task.title} photo ${i + 1}`}
                                    className="rounded-lg border border-amber-300 shadow-sm"
                                  />
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
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