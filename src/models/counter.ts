// src/models/Counter.ts
import mongoose, { Schema, Document } from "mongoose";

interface ICounter extends Document {
  name: string;
  date: string; // YYYY-MM-DD
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  name: { type: String, required: true },
  date: { type: String, required: true },
  sequence: { type: Number, required: true, default: 0 }
});

export const Counter = mongoose.model<ICounter>("Counter", CounterSchema);
