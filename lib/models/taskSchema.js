import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // Task info (set by admin)
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Employee submission
    initials: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    photos: [
      {
        type: String, // store photo URLs or paths
      },
    ],

    // Task tracking
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "INCOMPLETE"],
      default: "PENDING",
    },

    // Task generation system
    dateAssigned: { type: Date, default: Date.now }, // daily copy date
    expiresAt: { type: Date }, // when MongoDB auto-deletes it
  },
  { timestamps: true }
);

// Auto-delete old tasks after expiry date
taskSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Enable virtuals
taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
