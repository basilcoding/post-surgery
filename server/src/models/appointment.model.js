/*
  appointment-schema.js
  Mongoose Appointment schema (standalone).
  Exports: Appointment model
*/
import mongoose from 'mongoose';
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientProfile: { type: Schema.Types.ObjectId, ref: 'PatientProfile', required: true, index: true },
    DoctorProfile: { type: Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMins: { type: Number, required: true, min: 1 },
    day: { type: Date, required: true }, // day follows JS Date.getDay() (0 = Sunday … 6 = Saturday).

    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled',
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: String,

    // paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'n/a'], default: 'n/a' },
    // paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

    notes: String,
    patientNotes: String,
    archived: { type: Boolean, default: false }
});

// keep updatedAt current
appointmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// indexes
appointmentSchema.index({ doctor: 1, patient: 1, startTime: 1 }, { unique: true });

export default mongoose.model("Appointment", appointmentSchema);