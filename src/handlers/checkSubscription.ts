import {Context} from 'telegraf';
import {CHANNEL_ID} from '../shared/const/common.js';

// Check if user is subscribed to the channel
export default async function checkSubscription(ctx: Context): Promise<boolean> {
    try {
        const chatMember = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from!.id);
        return ['member', 'administrator', 'creator'].includes(chatMember.status);
    } catch (error) {
        console.error('Error checking subscription:', error);
        throw error;
    }
}
