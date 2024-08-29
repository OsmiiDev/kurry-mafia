import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, GuildChannel, Message, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, User, VoiceChannel } from 'discord.js'
import { Client, Guard, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'

import { Discord, Slash, SlashGroup, SlashOption } from '@/decorators'
import { Cooldown, GuildOnly } from '@/guards'
import { L } from '@/i18n'
import { WarnModule } from '@/modules'
import { Database } from '@/services'
import { argSplitter, hasCommandPermission, replyToInteraction, resolveDependency, simpleErrorEmbed, stringToTime, taskEmbed, timeToString } from '@/utils/functions'

@Discord()
@Category('Moderation')
export default class SlowmodeCommand {

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
            @SimpleCommandOption({ name: 'time', type: SimpleCommandOptionType.String }) time: string | undefined,
            command: SimpleCommandMessage
    ) {
        replyToInteraction(command, { content: '@TODO' }, false, true)
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
        if (length !== undefined && stringToTime(length) === -1)
            return simpleErrorEmbed(interaction, 'Invalid time format. Time is formatted as any number of `[0-9][s/m/h/d/w/mo/y]` (e.g. `1h30m`).')

        await interaction.deferReply()

        const tasks = await this.warnManager.warn(member, reason, length || undefined, interaction)

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
