import mongoose from 'mongoose';

const ClauseTemplateSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    text: { type: String, required: true },
    source_case_id: String,
    source_heading: String,
    tags: [String],
}, { timestamps: true });

ClauseTemplateSchema.index({ user_id: 1, name: 1 });

export default mongoose.models.ClauseTemplate || mongoose.model('ClauseTemplate', ClauseTemplateSchema);
