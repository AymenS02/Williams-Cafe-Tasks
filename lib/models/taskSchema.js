import mongoose from "mongoose";

// Task Schema
const taskSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["MASTER", "EMPLOYEE_COPY"],
      default: "EMPLOYEE_COPY",
    },

    // Task info
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // Category reference
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    // Employee submission fields
    initials: { type: String, trim: true },
    notes: { type: String, trim: true },
    photos: [{ type: String }],

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "INCOMPLETE"],
      default: "PENDING",
    },

    dateAssigned: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Only employee copies should expire
taskSchema.pre("save", function (next) {
  if (this.type === "EMPLOYEE_COPY" && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 1000); // delete after 30s
  }
  next();
});

// TTL index
taskSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

// Category Schema
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

export { Task, Category };
