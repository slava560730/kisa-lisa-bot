import {Logger} from '../shared/libs/logger/index.js';
import {Config, RestSchema} from '../shared/libs/config/index.js';
import {inject, injectable} from 'inversify';
import {Context, Markup, Telegraf} from 'telegraf';
import {
  deletePreviousMessages, getMongoURI,
  getSubscriptionKeyboard,
  saveMessageId, startChatActionAnimation
} from '../shared/helpers/index.js';
import {BENGAL_STICKER, BENGAL_STICKER_BEER, CHANNEL_ID} from '../shared/const/common.js';
import checkSubscription from '../handlers/checkSubscription.js';
import {guides} from '../shared/const/guides.js';
import * as fs from 'node:fs';
import {knownCommands} from '../shared/const/commands.js';
import {Component} from '../shared/types/index.js';
import {DatabaseClient} from '../shared/libs/database-client/index.js';
import {UserService} from '../shared/modules/user/index.js';

@injectable()
export class BotApplication {
  private bot: Telegraf;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
    @inject(Component.UserService) private readonly userService: UserService,
  ) {
  }

  public async init() {
    this.logger.info('Код обновлен');
    this.logger.info('Application initialization');

    this.logger.info('Init database');
    await this.initDb();
    this.logger.info('Init database completed');

    this.logger.info('Try to init bot…');
    await this._initBot();
  }

  private async initDb() {
    const mongoUri = getMongoURI(
      this.config.get('DB_USER'),
      this.config.get('DB_PASSWORD'),
      this.config.get('DB_HOST'),
      this.config.get('DB_PORT'),
      this.config.get('DB_NAME'),
    );

    return this.databaseClient.connect(mongoUri);
  }

  private async _initBot() {
    const BOT_TOKEN = this.config.get('BOT_TOKEN');
    this.bot = new Telegraf(BOT_TOKEN || "");
    this.logger.info('Bot inited');

    this.bot.use(async (ctx: Context, next) => {
      if (ctx.from && ctx.from.id) {
        await this.userService.findOrCreate({
          userId: ctx.from.id,
          username: ctx.from.username || '',
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name || '',});
      }
      return next();
    });

    // Start command handler
    this.bot.start(async (ctx) => {
      await deletePreviousMessages(ctx);

      const msgSticker = await ctx.replyWithSticker(BENGAL_STICKER_BEER);

      const welcomeMessage = `Приветики-пистолетики, ${ctx.from?.first_name || 'друг'}! 🐾 Это мой вездеССУЩИЙ бот😺
У меня есть подарок для тебя - который спасет ваш диван и нервы от запаха! Хочешь? Нажми ниже на кнопку, Мрррмяяя!`;


      const message = await ctx.reply(welcomeMessage, {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('Получить гайд 😺', 'get_guide')
        ]).reply_markup
      });

      saveMessageId(ctx, message.message_id);
      saveMessageId(ctx, msgSticker.message_id);
    });

// Handle "Get Guide" button
    this.bot.action('get_guide', async (ctx) => {
      await ctx.answerCbQuery();
      await deletePreviousMessages(ctx);

      const message = await ctx.reply(
          `Мяу! 😺 Чтобы забрать гайд, подпишись на мой канал ${CHANNEL_ID}!
    После подписки нажми "Проверить подписку".`,
          {
            reply_markup: getSubscriptionKeyboard()
          }
      );

      saveMessageId(ctx, message.message_id);
    });

    async function handleCheckSubscription(ctx: Context) {
      await deletePreviousMessages(ctx);
      let isSubscribed: boolean | null = null;
      let errorText = '';

      try {
        isSubscribed = await checkSubscription(ctx);
      } catch (e) {
        isSubscribed = null;
        errorText = 'Не удалось проверить подписку из-за технических проблем Telegram 😿. Попробуй позже!';
      }

      if (isSubscribed) {
        const buttons = guides.map(g =>
            g.isFree
                ? [Markup.button.callback(g.title, `get_${g.id}`)]
                : [Markup.button.url(`${g.title}`, g.paymentLink || "http://")]
        );

        const guidesMessage = await ctx.reply(
            'Выбери нужный гайд:',
            { reply_markup: Markup.inlineKeyboard(buttons).reply_markup }
        );
        saveMessageId(ctx, guidesMessage.message_id);
        return;
      } else if (isSubscribed === false) {
        const msgSticker = await ctx.replyWithSticker(BENGAL_STICKER);
        const message = await ctx.reply(
            `Мяу-мяу! 😺 Похоже, ты ещё не с нами в канале  ${CHANNEL_ID}.
            Подпишись и нажми "Проверить подписку" снова! Обещаем не спамить, а писать только по делу😏`,
            {
              reply_markup: getSubscriptionKeyboard()
            }
        );
        saveMessageId(ctx, message.message_id);
        saveMessageId(ctx, msgSticker.message_id);
      } else if (isSubscribed === null) {
        // Неизвестная ошибка (Telegram API, проблемы с каналом и т.д.)
        await ctx.reply(
            errorText || 'Не удалось проверить подписку. Попробуй позже!',
            { reply_markup: getSubscriptionKeyboard() }
        );
      }
    }

// Handle subscription check
    this.bot.action('check_subscription', async (ctx) => {
      await ctx.answerCbQuery();
      await handleCheckSubscription(ctx)
    })

// Обработка бесплатных гайдов
    guides.filter(g => g.isFree).forEach(g => {
      this.bot.action(`get_${g.id}`, async (ctx) => {
        await deletePreviousMessages(ctx);
        await ctx.answerCbQuery();
        if (fs.existsSync(g.path)) {
          let stopAnimation = null;
          let loadingMessage;
          try {
            stopAnimation = startChatActionAnimation(ctx, 'upload_document');
            loadingMessage = await ctx.reply('Загружаю выбранный гайд...⏳');
            const message = await ctx.replyWithDocument(
                { source: g.path, filename: g.filename },
                { caption: g.description }
            );
            saveMessageId(ctx, message.message_id);
          } catch (err) {
            console.error('Ошибка при отправке файла:', err);
            await ctx.reply('Ой, не удалось отправить гайд 😿 Попробуй позже!');
          } finally {
            if (loadingMessage) await ctx.deleteMessage(loadingMessage.message_id).catch(() => {});
            if (stopAnimation) stopAnimation();
          }
        } else {
          const message = await ctx.reply('Дико извиняемся, кажется какая-то собака украла гайд😡  Попробуй позже!\'');
          saveMessageId(ctx, message.message_id);
        }
      });
    });

    this.bot.command('guides', async (ctx) => {
      await handleCheckSubscription(ctx)
    });

    this.bot.command('help', async (ctx) => {
      const message = await ctx.reply(
          `Мяу! Я — бот Лиса Киса 🐾

Я помогу тебе избавиться от неприятных запахов и сохранить твой диван в порядке! Чтобы получить бесплатный гайд:

1. Нажми /start
2. Подпишись на наш канал
3. Нажми "Проверить подписку" — и получи список гайдов 😸

Если что-то не работает или есть вопросы, просто напиши в чат поддержки: @goodcovich

Мурр, хорошего дня!`
      );

      saveMessageId(ctx, message.message_id);
    });

// Обработка неизвестных команд
    this.bot.hears(/^\/.+/, async (ctx, next) => {
      const cmd = ctx.message.text.split(' ')[0];
      if (!knownCommands.includes(cmd)) {
        await ctx.reply('Мяу! Такой команды нет 🐾 Попробуй /help');
        return;
      }

      return next();
    });

// Error handling
    this.bot.catch((err, ctx) => {
      console.error(`Error for ${ctx.updateType}:`, err);
      ctx.reply('Ой, что-то пошло не так! 😿 Попробуй снова позже! 🐾');
    });

// Start the this.bot
    this.bot.launch().then(() => {
      console.log('Bot is running...');
    })

// Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}
