import { Telegraf, Markup } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from "dotenv";
import {BENGAL_STICKER, BENGAL_STICKER_BEER, CHANNEL_ID} from "./lib/const";
import {checkSubscription, deletePreviousMessages, saveMessageId} from "./lib/helpers";


dotenv.config();

const PDF_PATH = path.join(__dirname, '../guides/lisaFreeGuide.pdf');

const bot = new Telegraf(process.env.BOT_TOKEN || "");

// Start command handler
bot.start(async (ctx) => {
    await deletePreviousMessages(ctx);

    const msgSticker = await ctx.replyWithSticker(BENGAL_STICKER_BEER);

    const welcomeMessage = `Приветики пистолетики, ${ctx.from?.first_name || 'друг'}! 🐾 Это мой вездесущий бот😺
У меня есть подарок для тебя! Хочешь его? Нажми ниже, Мрррмяяя!`;


    const message = await ctx.reply(welcomeMessage, {
        reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('Получить гайд 😺', 'get_guide')
        ]).reply_markup
    });

    saveMessageId(ctx, message.message_id);
    saveMessageId(ctx, msgSticker.message_id);
});

// Handle "Get Guide" button
bot.action('get_guide', async (ctx) => {
    await ctx.answerCbQuery();
    await deletePreviousMessages(ctx);

    const message = await ctx.reply(
        `Мяу! 😺 Чтобы забрать гайд, подпишись на мой канал ${CHANNEL_ID}!
    После подписки нажми "Проверить подписку".`,
        {
            reply_markup: Markup.inlineKeyboard([
                Markup.button.url('Подписаться 😺', `https://t.me/${CHANNEL_ID.slice(1)}`),
    Markup.button.callback('Проверить подписку 🐾', 'check_subscription')
]).reply_markup
}
);

    saveMessageId(ctx, message.message_id);
});

// Handle subscription check
bot.action('check_subscription', async (ctx) => {
    await ctx.answerCbQuery();
    await deletePreviousMessages(ctx);

    const isSubscribed = await checkSubscription(ctx);

    if (isSubscribed) {
        if (fs.existsSync(PDF_PATH)) {
            const message = await ctx.replyWithDocument(
                { source: PDF_PATH, filename: 'Бесплатный гайд от Лисы.pdf' },
                { caption: 'Вот твой гайд! 🐾 Мрмя!' }
            );
            saveMessageId(ctx, message.message_id);
        } else {
            const message = await ctx.reply('Извини, файл гайда временно недоступен. Попробуй позже!');
            saveMessageId(ctx, message.message_id);
        }
    } else {
        await ctx.replyWithSticker(BENGAL_STICKER);
        const message = await ctx.reply(
            `Мяу-мяу! 😺 Похоже, ты ещё не с нами в канале  ${CHANNEL_ID}.
            Подпишись и нажми "Проверить подписку" снова!`,
            {
                reply_markup: Markup.inlineKeyboard([
                    Markup.button.url('Подписаться 😺', `https://t.me/${CHANNEL_ID.slice(1)}`),
        Markup.button.callback('Проверить подписку 🐾', 'check_subscription')
    ]).reply_markup
    }
    );
        saveMessageId(ctx, message.message_id);
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('Ой, что-то пошло не так! 😿 Попробуй снова позже! 🐾');
});

// Start the bot
bot.launch().then(() => {
    console.log('Bot is running...');
})

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));;