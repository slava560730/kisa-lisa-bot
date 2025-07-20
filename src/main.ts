import 'reflect-metadata';
import {Container} from 'inversify';
import * as dotenv from 'dotenv';
import {BotApplication} from './bot/index.js';
import {Component} from './shared/types/index.js';
import {createBotApplicationContainer} from './bot/bot.container.js';
import {createUserContainer} from './shared/modules/user/index.js';

dotenv.config();

async function bootstrap() {
    const appContainer = Container.merge(
        createBotApplicationContainer(),
        createUserContainer(),
    );

    const application = appContainer.get<BotApplication>(Component.BotApplication);

    await application.init();
}

bootstrap();


