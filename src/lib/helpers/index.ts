import {Context} from 'telegraf';
import {Update} from 'telegraf/typings/core/types/typegram';
import {UserState} from "../../models";
import {CHANNEL_ID} from "../const";
import {bold} from "telegraf/format";

const userStates: { [key: number]: UserState } = {};


export async function deletePreviousMessages(ctx: Context<Update>) {
    const userId = ctx.from?.id;
    if (userId && userStates[userId]?.lastBotMessageIds?.length) {
        for (const messageId of userStates[userId].lastBotMessageIds) {
            try {
                await ctx.deleteMessage(messageId);
            } catch (error) {
                console.error(`Failed to delete message ${messageId}:`, error);
            }
        }
        // Clear the message IDs after attempting deletion
        userStates[userId].lastBotMessageIds = [];
    }
}

// Function to save new message ID
export function saveMessageId(ctx: Context<Update>, messageId: number) {
    const userId = ctx.from?.id;
    if (userId) {
        if (!userStates[userId]) {
            userStates[userId] = { lastBotMessageIds: [] };
        }
        userStates[userId].lastBotMessageIds.push(messageId);
    }
}

// Check if user is subscribed to the channel
export async function checkSubscription(ctx: Context<Update>): Promise<boolean> {
    try {
        const chatMember = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from!.id);
        return ['member', 'administrator', 'creator'].includes(chatMember.status);
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}