import { GuildMember, TextChannel, User } from 'discord.js-light';

export abstract class UserUtils {
    public static isBot(user: User): boolean {
        return user.bot;
    }

    public static isAdmin(member: GuildMember, channel: TextChannel): boolean {
        return channel.permissionsFor(member).has('ADMINISTRATOR');
    }
}
