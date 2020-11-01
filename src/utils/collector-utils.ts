import { DMChannel, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import {
    CollectorUtils as DjsCollectorUtils,
    ExpireFunction,
    MessageFilter,
    MessageRetriever,
    ReactionFilter,
    ReactionRetriever,
} from 'discord.js-collector-utils';
import { MessageUtils, PermissionUtils } from '.';
import { ConfigSchema } from '../models/config-models';

let Config: ConfigSchema = require('../../config/config.json');

const STOP_COMMANDS = ['stop', 'cancel', 'exit', 'close', 'quit'];

export abstract class CollectorUtils {
    public static createMsgCollect(
        channel: TextChannel | DMChannel,
        user: User,
        expireEmbed?: MessageEmbed
    ): (messageRetriever: MessageRetriever) => Promise<any> {
        let collectFilter: MessageFilter = (nextMsg: Message): boolean =>
            nextMsg.author.id === user.id;

        let stopFilter: MessageFilter = (nextMsg: Message): boolean => {
            // Check if I have permission to send a message
            if (channel instanceof TextChannel && !PermissionUtils.canSendEmbed(channel)) {
                return true;
            }

            // Check if another command was ran, if so cancel the current running setup
            let nextMsgArgs = nextMsg.content.split(' ');
            if (
                [
                    Config.prefix,
                    `<@${channel.client.user.id}>`,
                    `<@!${channel.client.user.id}>`,
                    ...STOP_COMMANDS,
                ].includes(nextMsgArgs[0]?.toLowerCase())
            ) {
                return true;
            }

            return false;
        };

        let expireFunction: ExpireFunction = async () => {
            if (
                !(
                    expireEmbed &&
                    (channel instanceof DMChannel ||
                        (channel instanceof TextChannel && PermissionUtils.canSendEmbed(channel)))
                )
            ) {
                return;
            }

            await MessageUtils.send(channel, expireEmbed);
        };

        return (messageRetriever: MessageRetriever) =>
            DjsCollectorUtils.collectByMessage(
                channel,
                collectFilter,
                stopFilter,
                messageRetriever,
                expireFunction,
                { time: Config.experience.promptExpireTime * 1000, reset: true }
            );
    }

    public static createReactCollect(
        channel: TextChannel | DMChannel,
        user: User,
        expireEmbed?: MessageEmbed
    ): (msg: Message, reactionRetriever: ReactionRetriever) => Promise<any> {
        let collectFilter: ReactionFilter = (
            msgReaction: MessageReaction,
            reactor: User
        ): boolean => reactor.id === user.id;

        let stopFilter: MessageFilter = (nextMsg: Message): boolean => {
            // Check if I have permission to send a message
            if (channel instanceof TextChannel && !PermissionUtils.canSendEmbed(channel)) {
                return true;
            }

            // Check if another command was ran, if so cancel the current running setup
            let nextMsgArgs = nextMsg.content.split(' ');
            if (
                [
                    Config.prefix,
                    `<@${channel.client.user.id}>`,
                    `<@!${channel.client.user.id}>`,
                    ...STOP_COMMANDS,
                ].includes(nextMsgArgs[0]?.toLowerCase())
            ) {
                return true;
            }

            return false;
        };

        let expireFunction: ExpireFunction = async () => {
            if (
                !(
                    expireEmbed &&
                    (channel instanceof DMChannel ||
                        (channel instanceof TextChannel && PermissionUtils.canSendEmbed(channel)))
                )
            ) {
                return;
            }

            await MessageUtils.send(channel, expireEmbed);
        };

        return (msg: Message, reactionRetriever: ReactionRetriever) =>
            DjsCollectorUtils.collectByReaction(
                msg,
                collectFilter,
                stopFilter,
                reactionRetriever,
                expireFunction,
                { time: Config.experience.promptExpireTime * 1000, reset: true }
            );
    }
}
