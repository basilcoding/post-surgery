import mongoose from mongoose;

const notificationSchema = new Schema({
    user: { type: ObjectId, ref: 'User', index: true, required: true },
    type: { type: String, required: true },            
    title: { type: String, required: true },
    body: { type: String },
    entityRole: { type: String },                        
    priority: { type: String, default: 'normal' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    dismissed: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;