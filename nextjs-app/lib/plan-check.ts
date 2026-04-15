import dbConnect from './db/mongodb';
import User from './db/models/User';
import { PLANS, PlanKey } from './stripe';

export async function checkAnalysisLimit(userId: string): Promise<{ allowed: boolean; reason?: string; plan: string; used: number; limit: number }> {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) return { allowed: false, reason: 'User not found', plan: 'free', used: 0, limit: 0 };

    const plan = (user.plan || 'free') as PlanKey;
    const planConfig = PLANS[plan];
    const limit = planConfig.analysesPerMonth;

    // Unlimited plans
    if (limit === -1) return { allowed: true, plan, used: user.stats?.analysesThisMonth || 0, limit: -1 };

    // Reset monthly counter if needed
    const monthReset = user.stats?.monthReset ? new Date(user.stats.monthReset) : new Date(0);
    const now = new Date();
    if (now.getMonth() !== monthReset.getMonth() || now.getFullYear() !== monthReset.getFullYear()) {
        user.stats.analysesThisMonth = 0;
        user.stats.monthReset = now;
        await user.save();
    }

    const used = user.stats?.analysesThisMonth || 0;
    if (used >= limit) {
        return { allowed: false, reason: `Free plan limit reached (${limit}/month). Upgrade to Pro for unlimited analyses.`, plan, used, limit };
    }

    return { allowed: true, plan, used, limit };
}

export async function incrementAnalysisCount(userId: string) {
    await dbConnect();
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.analysesThisMonth': 1 } });
}
