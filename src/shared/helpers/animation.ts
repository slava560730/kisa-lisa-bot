import { Context } from 'telegraf';
import {MessageAnimations} from '../types/index.js';

export type StopAnimationFn = () => void;

/**
 * Запускает анимацию отправки файла (upload_document) для пользователя.
 * Возвращает функцию, которую надо вызвать для остановки анимации.
 */
export function startChatActionAnimation(
    ctx: Context,
    action: MessageAnimations,
    interval = 2000
): StopAnimationFn {
    let intervalId: NodeJS.Timeout | null = null;

    const sendAction = () => ctx.sendChatAction(action).catch(() => {});

    sendAction();
    intervalId = setInterval(sendAction, interval);

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
}
