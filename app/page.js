"use client";

import { useState, useEffect, useMemo } from "react";
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

    // Auto-refresh tasks every 5 minutes to show updates
    const refreshInterval = setInterval(() => {
      fetchTasks();
    }, 300000); // 5 minutes

    return () => {
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
    const status = isEdit ? formData.get("status") : unable ? "INCOMPLETE" : "COMPLETED";

    const validFiles = files.filter((file) => file && file.size > 0);

    if (status === "INCOMPLETE" && !notes?.trim()) {
      alert("Please explain why this task is incomplete.");
      return;
    }

    let photos = [];
    if (validFiles.length > 0) {
      photos = await Promise.all(
        validFiles.map(
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
          ? "Task marked as unable to complete."
          : isEdit
          ? "Task updated."
          : "Task completed. Great job!"
      );
      setEditingTaskId(null);
      fetchTasks();
    } else {
      alert("Error submitting task. Please try again.");
    }
  }

  async function handleUndoSubmission(taskId) {
    if (
      !confirm(
        "Undo this submission and set the task back to 'To Do'?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undo" }),
      });

      if (res.ok) {
        alert("Task reset to 'To Do'.");
        fetchTasks();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to undo submission"}`);
      }
    } catch (error) {
      console.error("Undo error:", error);
      alert("Network error while undoing submission.");
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
  const filteredTasks =
    selectedCategory === "ALL"
      ? tasks
      : tasks.filter((task) => task.category?._id === selectedCategory);

  // Basic progress metrics
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "COMPLETED").length,
    [tasks]
  );
  const incompleteCount = useMemo(
    () => tasks.filter((t) => t.status === "INCOMPLETE").length,
    [tasks]
  );
  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === "PENDING").length,
    [tasks]
  );

  if (loading) {
    return (
      <div className="p-6 text-center bg-amber-50 min-h-screen flex flex-col items-center justify-center text-amber-900">
        <div className="w-14 h-14 border-4 border-amber-300 border-t-amber-800 rounded-full animate-spin mb-4" />
        <p className="text-lg font-semibold">Loading today&apos;s tasks…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-br from-amber-50/95 via-orange-50/95 to-amber-100/95 backdrop-blur border-b border-amber-200 px-4 pt-4 pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-900 text-amber-50 w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              ☕
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-amber-900 leading-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Williams Cafe
              </h1>
              <p className="text-xs text-amber-700">Daily Task Checklist</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-xs text-amber-700">
            <span>
              Done:{" "}
              <strong className="text-amber-900">{completedCount}</strong>
            </span>
            <span>
              Left:{" "}
              <strong className="text-amber-900">
                {pendingCount + incompleteCount}
              </strong>
            </span>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex justify-between text-[11px] text-amber-700 mb-1 px-1">
            <span>To Do: {pendingCount}</span>
            <span>Done: {completedCount}</span>
            <span>Unable: {incompleteCount}</span>
          </div>
          <div className="h-2.5 w-full bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{
                width:
                  tasks.length > 0
                    ? `${(completedCount / tasks.length) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      </header>

      {/* Category Tabs (better for touch) */}
      {categories.length > 0 && (
        <div className="sticky top-[90px] z-20 px-4 pt-3 pb-2 bg-gradient-to-b from-amber-100/95 to-amber-50/95 backdrop-blur-sm border-b border-amber-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-amber-700 font-medium">
                Choose a section:
              </p>
              <button
                onClick={() => setSelectedCategory("ALL")}
                className="text-[11px] underline text-amber-700"
              >
                Show all
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold ${
                  selectedCategory === "ALL"
                    ? "bg-amber-900 text-amber-50 shadow-md"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                All ({tasks.length})
              </button>
              {categories.map((cat) => {
                const count = tasks.filter(
                  (t) => t.category?._id === cat._id
                ).length;
                return (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold ${
                      selectedCategory === cat._id
                        ? "bg-amber-900 text-amber-50 shadow-md"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
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

      {/* Main content */}
      <main className="px-4 pt-4 pb-8">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-amber-700 bg-white/80 max-w-md mx-auto p-6 rounded-2xl shadow-md text-base">
            {selectedCategory === "ALL"
              ? "No tasks available right now."
              : "No tasks in this section at the moment."}
          </p>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === "COMPLETED";
              const isIncomplete = task.status === "INCOMPLETE";
              const isPending = task.status === "PENDING";

              const cardBorderColor = isCompleted
                ? "border-green-400"
                : isIncomplete
                ? "border-red-400"
                : "border-amber-200";

              const cardBg =
                isCompleted || isIncomplete ? "bg-amber-50" : "bg-white";

              return (
                <section
                  key={task._id}
                  className={`${cardBg} p-4 rounded-2xl shadow-md border-2 ${cardBorderColor}`}
                >
                  {/* Task header */}
                  <div className="flex items-start gap-3">
                    <div className="text-3xl mt-1 w-8 text-center">
                      {isCompleted ? "✅" : isIncomplete ? "⚠️" : "☕"}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2
                          className="text-xl font-bold text-amber-900"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {task.title}
                        </h2>
                        {task.category && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-900 text-amber-50 px-2 py-1 rounded-full">
                            {task.category.name}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full border ${
                            isCompleted
                              ? "border-green-500 text-green-700 bg-green-50"
                              : isIncomplete
                              ? "border-red-500 text-red-700 bg-red-50"
                              : "border-amber-300 text-amber-700 bg-amber-50"
                          }`}
                        >
                          {isCompleted
                            ? "Done"
                            : isIncomplete
                            ? "Unable to complete"
                            : "To Do"}
                        </span>
                      </div>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Edit mode */}
                  {editingTaskId === task._id ? (
                    <form
                      onSubmit={(e) => handleSubmit(e, task._id, true)}
                      className="space-y-4 mt-4 bg-white p-4 rounded-xl border border-amber-200"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-1">
                          Status
                        </label>
                        <select
                          name="status"
                          defaultValue={task.status}
                          className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm"
                        >
                          <option value="COMPLETED">✅ Completed</option>
                          <option value="INCOMPLETE">⚠️ Unable to Complete</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-1">
                          Your Initials
                        </label>
                        <input
                          type="text"
                          name="initials"
                          defaultValue={task.initials}
                          required
                          className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm"
                          placeholder="e.g., JD"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-1">
                          Notes (required if unable to complete)
                        </label>
                        <input
                          type="text"
                          name="notes"
                          defaultValue={task.notes || ""}
                          className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm"
                          placeholder="Anything the manager should know"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-1">
                          Photos (optional)
                        </label>
                        <input
                          type="file"
                          name="photos"
                          multiple
                          accept="image/*"
                          className="text-amber-800 border-2 border-amber-300 p-2 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-900 file:text-amber-50 file:cursor-pointer hover:file:bg-amber-800"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors w-full font-semibold shadow-md text-sm"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors w-full font-semibold shadow-md text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : isCompleted ? (
                    <>
                      <div className="bg-green-50 border border-green-400 text-green-800 p-3 rounded-xl mt-4 text-sm">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>
                            Completed by{" "}
                            <strong>{task.initials || "—"}</strong>
                          </span>
                          {task.dateCompleted && (
                            <span className="text-[11px] text-green-700">
                              {new Date(
                                task.dateCompleted
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-amber-900">
                          <span className="font-semibold">Notes:</span>{" "}
                          {task.notes || "No notes added."}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {task.photos?.length > 0 && (
                          <button
                            onClick={() => openModal(task.photos)}
                            className="bg-amber-800 text-amber-50 px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-md text-sm"
                          >
                            View Photos ({task.photos.length})
                          </button>
                        )}
                        <button
                          onClick={() => setEditingTaskId(task._id)}
                          className="bg-yellow-400 text-amber-900 px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors shadow-md text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleUndoSubmission(task._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md text-sm"
                        >
                          Undo
                        </button>
                      </div>
                    </>
                  ) : isIncomplete ? (
                    <>
                      <div className="bg-red-50 border border-red-400 text-red-800 p-3 rounded-xl mt-4 text-sm">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span>
                            Marked unable by{" "}
                            <strong>{task.initials || "—"}</strong>
                          </span>
                          {task.dateCompleted && (
                            <span className="text-[11px] text-red-700">
                              {new Date(
                                task.dateCompleted
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-amber-900">
                          <span className="font-semibold">Reason:</span>{" "}
                          {task.notes || "No reason entered."}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => setEditingTaskId(task._id)}
                          className="bg-yellow-400 text-amber-900 px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors shadow-md text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleUndoSubmission(task._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md text-sm"
                        >
                          Undo
                        </button>
                      </div>
                    </>
                  ) : (
                    // PENDING – submission form
                    <form
                      onSubmit={(e) => handleSubmit(e, task._id)}
                      className="space-y-4 mt-4 bg-amber-50 p-4 rounded-xl border border-amber-200"
                    >
                      <div className="grid gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-amber-900 mb-1">
                            Your Initials
                          </label>
                          <input
                            type="text"
                            name="initials"
                            required
                            className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm"
                            placeholder="e.g., JD"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-amber-900 mb-1">
                            Notes (optional unless unable)
                          </label>
                          <input
                            type="text"
                            name="notes"
                            className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm"
                            placeholder="Anything important to mention"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-amber-900 mb-1">
                            Photos (optional)
                          </label>
                          <input
                            type="file"
                            name="photos"
                            multiple
                            accept="image/*"
                            className="text-amber-800 border-2 border-amber-300 p-2 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-900 file:text-amber-50 file:cursor-pointer hover:file:bg-amber-800"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <button
                          type="submit"
                          onClick={(e) =>
                            handleSubmit(e, task._id, false, false)
                          }
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full font-semibold text-base shadow-md"
                        >
                          Mark as Done
                        </button>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleSubmit(e, task._id, false, true)
                          }
                          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors w-full font-semibold text-base shadow-md"
                        >
                          Unable to Complete
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Photos Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-amber-50 rounded-2xl max-w-4xl w-full p-6 relative overflow-y-auto max-h-full border-4 border-amber-900 shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 bg-amber-900 text-amber-50 w-10 h-10 rounded-full font-bold text-2xl hover:bg-amber-800 transition-colors shadow-lg"
            >
              ×
            </button>
            <h3
              className="text-xl font-bold text-amber-900 mb-4"
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

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}