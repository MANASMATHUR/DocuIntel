import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    /** Ephemeral demo / guest accounts (tenant isolation); safe to TTL-clean in production */
    isGuest: {
        type: Boolean,
        default: false,
        index: true,
    },
    stats: {
        casesAnalyzed: { type: Number, default: 0 },
        clausesReviewed: { type: Number, default: 0 },
        criticalRisksFound: { type: Number, default: 0 },
        analysesThisMonth: { type: Number, default: 0 },
        monthReset: { type: Date, default: Date.now },
    },
    // Stripe billing
    plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripePriceId: String,
    stripeCurrentPeriodEnd: Date,
    // Integrations
    slackWebhookUrl: String,
    webhookUrl: String,
    webhookEvents: [String],
    googleDriveToken: mongoose.Schema.Types.Mixed,
    docusignToken: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
