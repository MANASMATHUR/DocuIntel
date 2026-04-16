import mongoose from 'mongoose';

const SharedReportSchema = new mongoose.Schema(
    {
        token: { type: String, required: true, unique: true, index: true },
        ownerUserId: { type: String, required: true, index: true },
        caseData: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

export default mongoose.models.SharedReport || mongoose.model('SharedReport', SharedReportSchema);
