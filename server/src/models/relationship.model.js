import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    surgeryName: {
        type: String,
        default: null
    },
    careType: { // Type of care or clinical context for this doctor-patient relationship
        type: String,
        enum: ['cardiology', 'general', 'psychiatry'],
        required: true
    },
    status: {
        type: Boolean,
        default: true,
        required: true,
    },
    notes: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
});

// Automatically ignore inactive (status: false)
// relationshipSchema.pre(/^find/, function (next) { // /^find/ means, this pre condition will be used for all queries starting with letters f i n d
//     if (!this.getQuery().hasOwnProperty('status')) {
//         this.where({ status: true });
//     }
//     next();
// });
relationshipSchema.pre(/^find/, function (next) { // /^find/ means, this pre condition will be used for all queries starting with letters f i n d
    const filter = this.getFilter();
    if (!('status' in filter)) this.where({ status: true });
    next();
});


relationshipSchema.index(
    { doctor: 1 },
    { partialFilterExpression: { status: true } }
);

relationshipSchema.index(
    { patient: 1 },
    { partialFilterExpression: { status: true } }
);

relationshipSchema.index(
    { doctor: 1, patient: 1 },
    { partialFilterExpression: { status: true } } // Create an index on doctor and patient that is only for documents where status is true.
);

// The partial index is a dynamic list of active documents.
// When status:true → document joins the list.
// When status:false → document is removed from the list.
// But the list (the index itself) remains — it’s not deleted unless you explicitly drop it.


const Relationship = mongoose.model("Relationship", relationshipSchema);

export default Relationship;
