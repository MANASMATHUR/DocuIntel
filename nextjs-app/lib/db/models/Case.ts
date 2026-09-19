import mongoose from 'mongoose';

const CollabNoteSchema = new mongoose.Schema(
    {
        id: String,
        text: String,
        at: String,
    },
    { _id: false }
);

const RiskSnapshotSchema = new mongoose.Schema(
    {
        at: String,
        critical: Number,
        high: Number,
        medium: Number,
        low: Number,
    },
    { _id: false }
);

const CaseSchema = new mongoose.Schema(
    {
        case_id: {
            type: String,
            required: true,
            unique: true,
        },
        user_id: {
            type: String,
            required: true,
            index: true,
        },
        starred: {
            type: Boolean,
            default: false,
        },
        archived: {
            type: Boolean,
            default: false,
            index: true,
        },
        title: {
            type: String,
            default: 'Untitled Case',
        },
        status: {
            type: String,
            default: 'processing',
        },
        date: {
            type: Date,
            default: Date.now,
        },
        type: {
            type: String,
            default: 'Contract',
        },
        instructions: String,
        clauses: [mongoose.Schema.Types.Mixed],
        risks: [mongoose.Schema.Types.Mixed],
        redlines: mongoose.Schema.Types.Mixed,
        reports: mongoose.Schema.Types.Mixed,
        summary: mongoose.Schema.Types.Mixed,
        logs: [mongoose.Schema.Types.Mixed],
        vectorStats: mongoose.Schema.Types.Mixed,
        analysis_meta: mongoose.Schema.Types.Mixed,
        collaboration: {
            assignedTo: { type: String, default: '' },
            dueDate: { type: String, default: '' },
            notes: [CollabNoteSchema],
            pinnedClauseIds: [String],
        },
        riskHistory: [RiskSnapshotSchema],
    },
    { timestamps: true }
);

CaseSchema.index({ user_id: 1, case_id: 1 });
CaseSchema.index({ title: 'text', 'clauses.text': 'text', 'clauses.heading': 'text' });

export default mongoose.models.Case || mongoose.model('Case', CaseSchema);
