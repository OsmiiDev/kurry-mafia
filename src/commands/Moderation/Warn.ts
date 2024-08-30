import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, GuildChannel, User } from 'discord.js'
import { Client, Guard, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'

import { Discord, Slash, SlashOption } from '@/decorators'
import { Cooldown, GuildOnly } from '@/guards'
import { L } from '@/i18n'
import { WarnModule } from '@/modules'
import { argSplitter, hasCommandPermission, replyToInteraction, resolveDependency, simpleErrorEmbed, stringToTime, taskEmbed } from '@/utils/functions'

@Discord()
@Category('Moderation')
export default class WarnCommand {

    client: Client
    warnManager: WarnModule

    constructor() {
        resolveDependency(Client).then(client => this.client = client)
        resolveDependency(WarnModule).then(warnManager => this.warnManager = warnManager)
    }

    @SimpleCommand({
        name: 'warn',
    })
    @Guard(GuildOnly, Cooldown(3))
    async warnCommand(
            @SimpleCommandOption({ name: 'user', type: SimpleCommandOptionType.User }) user: User,
            command: SimpleCommandMessage
    ) {
        const assoc = (await command.message.guild!.commands.fetch()).find(cmd => cmd.name === 'warn')
        if (!(await hasCommandPermission(command.message.member!, command.message.channel as GuildChannel, assoc!, this.client))) return

        const ref = await command.message.fetchReference().catch(() => null)
        const member = ref ? ref.member : await command.message.guild!.members.fetch(user.id).catch(() => null)

        const reason = argSplitter(command.message.content).slice(ref ? 1 : 2).join(' ')
        console.log(reason)

        if (!member)
            return simpleErrorEmbed(command, 'User not found or is no longer in the server.')

        const tasks = await this.warnManager.warn(member, reason, undefined, command, ref)
        if (ref?.deletable) await ref.delete().catch(() => null)

        const builder = taskEmbed(new EmbedBuilder()
            .setDescription(L.en.COMMANDS.WARN.EMBED.DESCRIPTION({
                user: `<@${member.id}>`,
                reason: reason || L.en.COMMANDS.WARN.REASON(),
            }))
            .setTitle(L.en.COMMANDS.WARN.EMBED.TITLE())
            .setFooter({
                text: `@${command.message.author.username}`,
                iconURL: command.message.author.displayAvatarURL(),
            })
            .setTimestamp(), tasks, {
            reason: reason || L.en.COMMANDS.WARN.REASON(),
        })

        replyToInteraction(command, { embeds: [builder] }, false, true)
    }

    @Slash({
        description: 'Warn a user.',
        defaultMemberPermissions: ['ModerateMembers'],
    })
    async warn(
        @SlashOption({ name: 'user', type: ApplicationCommandOptionType.User, required: true, description: 'The user to warn' }) user: User,
        @SlashOption({ name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'The reason for this warn' }) reason: string,
        @SlashOption({ name: 'length', type: ApplicationCommandOptionType.String, required: false, description: 'How long until this warn should automatically expire', autocomplete(interaction, _command) {
            const value = interaction.options.getFocused() || ''

            const times = ['-', '1h', '6h', '12h', '1d', '3d', '1w', '1mo', '3mo', '6mo']
                .filter(time => time.includes(value) && time !== value)
                .map(time => ({
                    name: time,
                    value: time,
                }))

            if (value === '') {
                interaction.respond([...times])
            } else {
                interaction.respond([{
                    name: value,
                    value,
                }, ...times])
            }
        } }) length: string,
        interaction: CommandInteraction,
        client: Client,
        { localize }: InteractionData
    ) {
        const member = await interaction.guild!.members.fetch(user.id).catch(() => null)

        console.log(length)
        if (!member)
            return simpleErrorEmbed(interaction, 'User not found or is no longer in the server.')
        if (length !== undefined && stringToTime(length) === null)
            return simpleErrorEmbed(interaction, 'Invalid time format. Time is formatted as any number of `[0-9][s/m/h/d/w/mo/y]` (e.g. `1h30m`).')

        await interaction.deferReply()

        const tasks = await this.warnManager.warn(member, reason, length || undefined, interaction, null)

        const builder = taskEmbed(new EmbedBuilder()
            .setDescription(localize.COMMANDS.WARN.EMBED.DESCRIPTION({
                user: `<@${user.id}>`,
                reason: reason || localize.COMMANDS.WARN.REASON(),
            }))
            .setTitle(localize.COMMANDS.WARN.EMBED.TITLE())
            .setFooter({
                text: `@${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp(), tasks, {
            reason: reason || localize.COMMANDS.WARN.REASON(),
        })

        replyToInteraction(interaction, { embeds: [builder] }, false, true)
    }

}
