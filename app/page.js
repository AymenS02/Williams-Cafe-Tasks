"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modalImages, setModalImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    
    // FOR TESTING: Auto-deploy tasks every 30 seconds
    const deployInterval = setInterval(async () => {
      console.log('[AUTO-DEPLOY] Deploying tasks...');
      try {
        const res = await fetch('/api/cron/deploy-tasks', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test'}`
          }
        });
        const data = await res.json();
        console.log('[AUTO-DEPLOY] Result:', data);
        fetchTasks(); // Refresh task list
      } catch (err) {
        console.error('[AUTO-DEPLOY] Error:', err);
      }
    }, 30000); // 30 seconds
    
    // Auto-refresh tasks every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchTasks();
    }, 30000);
    
    return () => {
      clearInterval(deployInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const res = await fetch("/api/tasks?type=EMPLOYEE_COPY");
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }

  async function fetchCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  }

  async function handleSubmit(e, taskId, isEdit = false, unable = false) {
    e.preventDefault();
    const formData = new FormData(e.target.form || e.target);
    const initials = formData.get("initials");
    const notes = formData.get("notes");
    const files = formData.getAll("photos");
    const status = unable ? "INCOMPLETE" : "COMPLETED";

    const validFiles = files.filter(file => file && file.size > 0);

    if (status === "COMPLETED" && validFiles.length === 0) {
      alert("❌ Must submit images if task completed");
      return;
    }
    
    if (status === "INCOMPLETE" && !notes?.trim()) {
      alert("❌ Must provide notes explaining why task is incomplete");
      return;
    }

    let photos = [];
    if (files.length > 0) {
      photos = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
    }

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initials, notes, photos, status }),
    });

    if (res.ok) {
      alert(
        unable
          ? "⚠️ Task marked as unable to complete."
          : isEdit
          ? "✅ Task updated!"
          : "✅ Task completed!"
      );
      setEditingTaskId(null);
      fetchTasks();
    } else {
      alert("❌ Error submitting task");
    }
  }

  function openModal(images) {
    setModalImages(images);
    setIsModalOpen(true);
  }

  function closeModal() {
    setModalImages([]);
    setIsModalOpen(false);
  }

  // Filter tasks by selected category
  const filteredTasks = selectedCategory === "ALL" 
    ? tasks 
    : tasks.filter(task => task.category?._id === selectedCategory);

  // Group tasks by category for display
  const tasksByCategory = categories.reduce((acc, cat) => {
    acc[cat._id] = filteredTasks.filter(task => task.category?._id === cat._id);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6 text-center bg-amber-50 min-h-screen flex items-center justify-center text-amber-900 text-lg">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-8 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <div className="inline-block bg-amber-900 text-amber-50 px-6 py-3 rounded-full mb-4 shadow-lg">
          <span className="text-2xl">☕</span>
        </div>
        <h1
          className="text-4xl font-bold text-amber-900 mb-2"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Williams Cafe
        </h1>
        <p className="text-amber-700 text-lg">Daily Task Checklist</p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-amber-200">
            <label className="block font-semibold text-amber-900 mb-3 text-center">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-amber-900 text-amber-50 shadow-md"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              {categories.map((cat) => {
                const count = tasks.filter(t => t.category?._id === cat._id).length;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedCategory === cat._id
                        ? "bg-amber-900 text-amber-50 shadow-md"
                        : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <p className="text-center text-amber-600 bg-white/60 max-w-md mx-auto p-6 rounded-lg shadow">
          {selectedCategory === "ALL" 
            ? "No tasks available today."
            : "No tasks in this category."}
        </p>
      ) : (
        <div className="max-w-3xl mx-auto space-y-5">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl mt-1">
                  {task.status === "COMPLETED" ? "✅" : task.status === "INCOMPLETE" ? "⚠️" : "☕"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2
                      className="text-2xl font-bold text-amber-900"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {task.title}
                    </h2>
                    {task.category && (
                      <span className="text-xs bg-amber-900 text-amber-50 px-2 py-1 rounded-full">
                        {task.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Edit mode form */}
              {editingTaskId === task._id ? (
                <form
                  onSubmit={(e) => handleSubmit(e, task._id, true)}
                  className="space-y-4 mt-4 bg-amber-50 p-5 rounded-xl border border-amber-200"
                >
                  <div>
                    <label className="block font-semibold text-amber-900 mb-2">
                      Update Initials
                    </label>
                    <input
                      type="text"
                      name="initials"
                      defaultValue={task.initials}
                      required
                      className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white"
                      placeholder="e.g., JD"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-2">
                      Update Notes (optional)
                    </label>
                    <input
                      type="text"
                      name="notes"
                      defaultValue={task.notes || ""}
                      className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white"
                      placeholder="e.g., Completed all prep work."
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-2">
                      Re-upload Photo(s)
                    </label>
                    <input
                      type="file"
                      name="photos"
                      multiple
                      accept="image/*"
                      className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-900 file:text-amber-50 file:cursor-pointer hover:file:bg-amber-800"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full font-semibold shadow-md"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors w-full font-semibold shadow-md"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : task.status === "COMPLETED" ? (
                <>
                  <div className="bg-green-100 border-2 border-green-500 text-green-800 p-4 rounded-xl mt-4">
                    <span className="text-lg">
                      ✅ Completed by{" "}
                      <strong className="font-bold">{task.initials}</strong>
                    </span>
                  </div>

                  <div className="mt-2 text-amber-800">
                    <strong className="font-semibold">Notes:</strong>{" "}
                    {task.notes || "No notes provided."}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    {task.photos?.length > 0 && (
                      <button
                        onClick={() => openModal(task.photos)}
                        className="bg-amber-700 text-amber-50 px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-md font-medium"
                      >
                        📷 View Images ({task.photos.length})
                      </button>
                    )}
                    <button
                      onClick={() => setEditingTaskId(task._id)}
                      className="bg-yellow-500 text-amber-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors shadow-md font-medium"
                    >
                      ✏️ Edit Submission
                    </button>
                  </div>
                </>
              ) : task.status === "INCOMPLETE" ? (
                <>
                  <div className="bg-red-100 border-2 border-red-500 text-red-800 p-4 rounded-xl mt-4">
                    <span className="text-lg">
                      ⚠️ Marked incomplete by{" "}
                      <strong className="font-bold">{task.initials}</strong>
                    </span>
                  </div>

                  <div className="mt-2 text-amber-800">
                    <strong className="font-semibold">Reason:</strong>{" "}
                    {task.notes || "No reason provided."}
                  </div>

                  <button
                    onClick={() => setEditingTaskId(task._id)}
                    className="mt-4 bg-yellow-500 text-amber-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors shadow-md font-medium"
                  >
                    ✏️ Edit Submission
                  </button>
                </>
              ) : (
                <form
                  onSubmit={(e) => handleSubmit(e, task._id)}
                  className="space-y-4 mt-4 bg-amber-50 p-5 rounded-xl border border-amber-200"
                >
                  <div>
                    <label className="block font-semibold text-amber-900 mb-2">
                      Your Initials
                    </label>
                    <input
                      type="text"
                      name="initials"
                      required
                      className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white"
                      placeholder="e.g., JD"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-2">
                      Notes (if task incomplete, please explain)
                    </label>
                    <input
                      type="text"
                      name="notes"
                      className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white"
                      placeholder="e.g., Completed all prep work."
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-2">
                      Upload Photo(s)
                    </label>
                    <input
                      type="file"
                      name="photos"
                      multiple
                      accept="image/*"
                      className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-900 file:text-amber-50 file:cursor-pointer hover:file:bg-amber-800"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      onClick={(e) => handleSubmit(e, task._id, false, false)}
                      className="bg-amber-900 text-amber-50 px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors w-full font-semibold text-lg shadow-md"
                    >
                      ✅ Submit Task
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, task._id, false, true)}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors w-full font-semibold text-lg shadow-md"
                    >
                      ⚠️ Unable to Complete
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-amber-50 rounded-2xl max-w-4xl w-full p-6 relative overflow-y-auto max-h-full border-4 border-amber-900 shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 bg-amber-900 text-amber-50 w-10 h-10 rounded-full font-bold text-2xl hover:bg-amber-800 transition-colors shadow-lg"
            >
              ×
            </button>
            <h3
              className="text-2xl font-bold text-amber-900 mb-4"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Task Photos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalImages.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`Task image ${i + 1}`}
                  className="rounded-lg border-2 border-amber-300 shadow-md"
                  width={400}
                  height={300}
                  style={{ objectFit: "cover" }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}