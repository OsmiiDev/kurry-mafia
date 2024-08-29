import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, GuildChannel, Message, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from 'discord.js'
import { Client, Guard, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'

import { dashboardConfig } from '@/configs'
import { Discord, Slash, SlashGroup, SlashOption } from '@/decorators'
import { Cooldown, GuildOnly } from '@/guards'
import { L } from '@/i18n'
import { SlowmodeModule } from '@/modules'
import { Database } from '@/services'
import { argSplitter, hasCommandPermission, replyToInteraction, resolveDependency, simpleErrorEmbed, stringToTime, taskEmbed, timeToString } from '@/utils/functions'

@Discord()
@Category('Moderation')
@SlashGroup({ description: 'Set slowmode globally, in a channel, or in a category.', name: 'slowmode', defaultMemberPermissions: ['ManageChannels'] })
// Assign all inherit slashes to the group
@SlashGroup('slowmode')
export default class SlowmodeCommand {

    client: Client
    slowmode: SlowmodeModule

    constructor() {
        resolveDependency(Client).then(client => this.client = client)
        resolveDependency(SlowmodeModule).then(slowmode => this.slowmode = slowmode)
    }

    @SimpleCommand({
        name: 'slowmode',
    })
    @Guard(GuildOnly, Cooldown(3))
    async slowmodeCommand(
            @SimpleCommandOption({ name: 'time', type: SimpleCommandOptionType.String }) time: string | undefined,
            command: SimpleCommandMessage
    ) {
        const assoc = (await command.message.guild!.commands.fetch()).find(cmd => cmd.name === 'slowmode')
        if (!(await hasCommandPermission(command.message.member!, command.message.channel as GuildChannel, assoc!, this.client))) return

        const reason = argSplitter(command.message.content).length > 2 ? argSplitter(command.message.content).slice(2).join(' ') : undefined
        const localize = L.en

        const channel = command.message.channel as TextChannel
        time = time || '0s'

        if (stringToTime(time) === -1)
            return simpleErrorEmbed(command, 'Invalid time format. Time is formatted as any number of `[0-9][s/m/h/d/w/mo/y]` (e.g. `1h30m`).')
        if (stringToTime(time) && ((stringToTime(time) || 0) > 21600000))
            return simpleErrorEmbed(command, 'Slowmode cannot be set to more than 6 hours.')

        const tasks = await this.slowmode.updateSlowmode([channel], reason, time, 'permanent', command)

        const timeText = time === 'adaptive' ? 'Adaptive' : timeToString(stringToTime(time) || 0)
        const lengthText = 'Indefinite'

        const builder = taskEmbed(new EmbedBuilder()
            .setDescription(localize.COMMANDS.SLOWMODE.EMBED.DESCRIPTION({ time: timeText, length: lengthText }))
            .setTitle(localize.COMMANDS.SLOWMODE.EMBED.TITLE())
            .setFooter({
                text: `@${command.message.author.username}`,
                iconURL: command.message.author.displayAvatarURL(),
            })
            .setTimestamp(), tasks, {
            reason: reason || localize.COMMANDS.SLOWMODE.REASON(),
        })

        replyToInteraction(command, { embeds: [builder] }, false, true)
    }

    @Slash({
        description: 'Set slowmode for all configured channels.',
    })
    async discord(
        @SlashOption({ name: 'time', type: ApplicationCommandOptionType.String, required: false, description: 'How long the slowmode should be', autocomplete(interaction, _command) {
            const value = interaction.options.getFocused() || ''

            if (stringToTime(value) && ((stringToTime(value) || 0) > 21600000)) {
                return interaction.respond([{
                    name: 'Slowmode cannot be set to more than 6 hours.',
                    value: '-',
                }])
            }
            const times = ['5s', '10s', '15s', '30s', '1m', '2m', '5m', '10m', '15m', '30m', '1h', '2h', '6h']
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
        } }) time: string,
        @SlashOption({ name: 'for', type: ApplicationCommandOptionType.String, required: false, description: 'How long until the slowmode should automatically revert', autocomplete(interaction, _command) {
            const value = interaction.options.getFocused() || ''
            if (value === '') {
                interaction.respond([])
            } else {
                interaction.respond([{
                    name: value,
                    value,
                }, {
                    name: 'Permanent',
                    value: 'permanent',
                }])
            }
        } }) length: string,
        @SlashOption({ name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'The reason for setting the slowmode' }) reason: string,
        interaction: CommandInteraction,
        client: Client,
        { localize }: InteractionData
    ) {
        time = time || '0s'
        length = length || 'permanent'

        if (stringToTime(time) === -1)
            return simpleErrorEmbed(interaction, 'Invalid time format. Time is formatted as any number of `[0-9][s/m/h/d/w/mo/y]` (e.g. `1h30m`).')
        if (stringToTime(length) === -1 && length !== 'permanent')
            return simpleErrorEmbed(interaction, 'Invalid time format. Time is formatted as any number of `[0-9][s/m/h/d/w/mo/y]` (e.g. `1h30m`).')
        if (stringToTime(time) && ((stringToTime(time) || 0) > 21600000))
            return simpleErrorEmbed(interaction, 'Slowmode cannot be set to more than 6 hours.')

        await interaction.deferReply()

        const channels = dashboardConfig.modules.moderation.slowmode.globalChannels
            .map(channelId => interaction.guild!.channels.cache.get(channelId))
            .filter(channel => channel !== undefined) as GuildChannel[]

        const tasks = await this.slowmode.updateSlowmode(channels, reason, time, length, interaction)

        const timeText = time === 'adaptive' ? 'Adaptive' : timeToString(stringToTime(time) || 0)
        const lengthText = length === 'permanent' ? 'Indefinite' : timeToString(stringToTime(length) || 0)

        const builder = taskEmbed(new EmbedBuilder()
            .setDescription(localize.COMMANDS.SLOWMODE.EMBED.DESCRIPTION({ time: timeText, length: lengthText }))
            .setTitle(localize.COMMANDS.SLOWMODE.EMBED.TITLE())
            .setFooter({
                text: `@${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp(), tasks, {
            reason: reason || localize.COMMANDS.SLOWMODE.REASON(),
        })

        replyToInteraction(interaction, { embeds: [builder] }, false, true)
    }

    @Slash({
        description: 'Set slowmode for a specific channel.',
    })
    async channel(
        @SlashOption({ name: 'time', type: ApplicationCommandOptionType.String, required: false, description: 'How long the slowmode should be', autocomplete(interaction, _command) {
            const value = interaction.options.getFocused() || ''

            if (stringToTime(value) && ((stringToTime(value) || 0) > 21600000)) {
                return interaction.respond([{
                    name: 'Slowmode cannot be set to more than 6 hours.',
                    value: '-',
                }])
            }
            const times = ['5s', '10s', '15s', '30s', '1m', '2m', '5m', '10m', '15m', '30m', '1h', '2h', '6h']
                .filter(time => time.includes(value) && time !== value)
                .map(time => ({
                    name: time,
                    value: time,
                }))

            if (value === '') {
                interaction.respond([...times, {
                    name: 'Adaptive',
                    value: 'adaptive',
                }])
            } else {
                interaction.respond([{
                    name: value,
                    value,
                }, ...times, {
                    name: 'Adaptive',
                    value: 'adaptive',
                }])
            }
        } }) time: string,
		@SlashOption({ name: 'channel', type: ApplicationCommandOptionType.Channel, required: false, description: 'The channel to set the slowmode in' }) channel: TextChannel,
        @SlashOption({ name: 'for', type: ApplicationCommandOptionType.String, required: false, description: 'How long until the slowmode should automatically revert', autocomplete(interaction, _command) {
            const value = interaction.options.getFocused() || ''
            if (value === '') {
                interaction.respond([])
            } else {
                interaction.respond([{
                    name: value,
                    value,
                }, {
                    name: 'Permanent',
                    value: 'permanent',
                }])
            }
        } }) length: string,
        @SlashOption({ name: 'reason', type: ApplicationCommandOptionType.String, required: false, description: 'The reason for setting the slowmode' }) reason: string,

        interaction: CommandInteraction,
        client: Client,
        { localize }: InteractionData
    ) {
        time = time || '0s'
        length = length || 'permanent'
        channel = channel || interaction.channel as TextChannel

        await interaction.deferReply()

        const tasks = await this.slowmode.updateSlowmode([channel], reason, time, length, interaction)

        const timeText = timeToString(stringToTime(time) || 0)
        const lengthText = length === 'permanent' ? 'Indefinite' : timeToString(stringToTime(length) || 0)

        const builder = taskEmbed(new EmbedBuilder()
            .setDescription(localize.COMMANDS.SLOWMODE.EMBED.DESCRIPTION({ time: timeText, length: lengthText }))
            .setTitle(localize.COMMANDS.SLOWMODE.EMBED.TITLE())
            .setFooter({
                text: `@${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp(), tasks, {
            reason: reason || localize.COMMANDS.SLOWMODE.REASON(),
        })

        replyToInteraction(interaction, { embeds: [builder] }, false, true)
    }

}
