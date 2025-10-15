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

    // Category reference - THIS IS THE CRITICAL FIELD
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Category", 
      required: true 
    },

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
    dateCompleted: { type: Date }, // Timestamp when task was completed/incomplete
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Only employee copies should expire
taskSchema.pre("save", function (next) {
  if (this.type === "EMPLOYEE_COPY" && !this.expiresAt) {
    const now = new Date();
    const expires = new Date();
    expires.setHours(4, 0, 0, 0); // 4:00 AM today

    // If 4 AM has already passed today, set to 4 AM tomorrow
    if (expires <= now) {
      expires.setDate(expires.getDate() + 1);
    }

    this.expiresAt = expires; // delete at the next 4 AM
  }
  next();
});


// TTL index
taskSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Performance indexes
taskSchema.index({ type: 1, createdAt: -1 }); // Compound index for filtering by type and sorting
taskSchema.index({ createdAt: -1 }); // Simple index for createdAt sorting
taskSchema.index({ status: 1, createdAt: -1 }); // For status-based queries
taskSchema.index({ dateCompleted: -1 }); // Index for completion timestamp queries
taskSchema.index({ status: 1, dateCompleted: -1 }); // For completion status and time queries

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

// Category Schema
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

// Archive Schema - stores completed tasks by date
const archiveSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    tasks: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
      initials: { type: String },
      notes: { type: String },
      photos: [{ type: String }],
      status: { 
        type: String, 
        enum: ["COMPLETED", "INCOMPLETE", "PENDING"],
        default: "PENDING"
      },
      completedAt: { type: Date },
    }],
    expiresAt: { type: Date }, // Auto-delete after 7 days
  },
  { timestamps: true }
);

// Set expiration to 7 days from creation
archiveSchema.pre("save", function (next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days 7 * 24 * 60 * 60 * 1000
  }
  next();
});

// TTL index for auto-deletion
archiveSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Archive = mongoose.models.Archive || mongoose.model("Archive", archiveSchema);

export { Task, Category, Archive };