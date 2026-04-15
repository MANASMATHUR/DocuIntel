import mongoose from 'mongoose';

const ResetTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete expired tokens
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ResetToken || mongoose.model('ResetToken', ResetTokenSchema);
