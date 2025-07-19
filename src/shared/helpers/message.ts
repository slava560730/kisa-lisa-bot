import {Context, Markup} from 'telegraf';
import {InlineKeyboardMarkup} from '@telegraf/types';
import {UserState} from '../types/index.js';
import {CHANNEL_ID} from '../const/common.js';

const userStates: { [key: number]: UserState } = {};

export async function deletePreviousMessages(ctx: Context) {
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
export function saveMessageId(ctx: Context, messageId: number) {
    const userId = ctx.from?.id;
    if (userId) {
        if (!userStates[userId]) {
            userStates[userId] = {lastBotMessageIds: []};
        }
        userStates[userId].lastBotMessageIds.push(messageId);
    }
}

export function getSubscriptionKeyboard(): InlineKeyboardMarkup {
    return Markup.inlineKeyboard([Markup.button.url('Подписаться 😺', `https://t.me/${CHANNEL_ID.slice(1)}`), Markup.button.callback('Проверить подписку 🐾', 'check_subscription')]).reply_markup;
}

