// utils/idGenerator.js
import { Counter } from "../models/counter.model.js";

async function getNextSequence(type) {
  const counter = await Counter.findOneAndUpdate(
    { type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

export async function generatePatientId() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence("patient");
  return `PAT-${year}-${String(seq).padStart(4, "0")}`;
}

export async function generateDoctorId() {
  const year = new Date().getFullYear();
  const seq = await getNextSequence("doctor");
  return `DOC-${year}-${String(seq).padStart(4, "0")}`;
}
