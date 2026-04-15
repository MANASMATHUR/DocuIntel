import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
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
}, { timestamps: true });

export default mongoose.models.Case || mongoose.model('Case', CaseSchema);
