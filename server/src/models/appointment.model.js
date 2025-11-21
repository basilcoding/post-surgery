/*
  appointment-schema.js
  Mongoose Appointment schema (standalone).
  Exports: Appointment model
*/
import mongoose from 'mongoose';
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    patientProfile: { type: Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    doctorProfile: { type: Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    // clinic: { type: Schema.Types.ObjectId, ref: 'Clinic' },
    // startTime: { type: Date, required: true },
    // endTime: { type: Date, required: true },
    // durationMins: { type: Number, required: true, min: 1 },
    appointmentDate: { type: String, required: true }, // "YYYY-MM-DD"
    slot: { type: String, required: true }, // "HH:mm" (slot start in doctor's local time)
    // durationMins: { type: Number, required: true, min: 1 },
    // day: { type: Date, required: true }, // day follows JS Date.getDay() (0 = Sunday … 6 = Saturday).

    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled',
    },

    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: String,

    // paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'n/a'], default: 'n/a' },
    // paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

    notes: String,
    patientNotes: { type: String, default: null },
    // archived: { type: Boolean, default: false }
}, { timestamps: true });

// keep updatedAt current
appointmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// indexes
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1, slot: 1, createdAt: 1 });


export default mongoose.model("Appointment", appointmentSchema);