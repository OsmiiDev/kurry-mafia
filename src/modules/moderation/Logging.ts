import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextBasedChannel } from 'discord.js'
import { Client } from 'discordx'
import { delay, inject } from 'tsyringe'

import { dashboardConfig } from '@/configs'
import { Service } from '@/decorators'
import { Database, EventManager, Logger } from '@/services'
import { buildMessage, timeToString } from '@/utils/functions'

@Service()
export class LoggingModule {

    transformers: Record<string, (data: TimedAction) => Promise<EmbedBuilder>> = {
        'slowmode': async (data) => {
            const user = await this.client.users.fetch(data.userId!).catch(() => null)
            if (!user) return new EmbedBuilder()

            const lines = [
                `> **Moderator:** <@${data.userId}>`,
                `> **Channels:** ${data.additionalData.channels.length} channels`,
                `> **Length:** ${data.endTime === -1 ? 'Permanent' : timeToString(data.endTime - data.startTime, true)}`,
                `> **Reason:** ${data.reason}`,
            ]

            console.log(lines[4])

            return new EmbedBuilder()
                .setDescription(`${lines.join('\n')}\n`)
                .setColor(0xFEE75C)
        },
        'reset-slowmode': async (data) => {
            const lines = [
                    `> **Moderator:** <@${data.userId}>`,
                    `> **Channels:** ${data.additionalData.channels.length} channels`,
                    `> **Reason:** ${data.reason}`,
            ]

            return new EmbedBuilder()
                .setDescription(`${lines.join('\n')}\n`)
                .setColor(0xFEE75C)
        },
        'warn': async (data) => {
            const lines = [
                `> **Moderator:** <@${data.moderatorId}>`,
                `> **User:** <@${data.userId}>`,
                `> **Length:** ${data.additionalData.duration === -1 ? 'Permanent' : timeToString(data.additionalData.duration * 1000, true)}`,
                `> **Reason:** ${data.reason}`,
            ]

            return new EmbedBuilder()
                .setDescription(`${lines.join('\n')}\n`)
                .setColor(0xFEE75C)
        },
    }

    includeEvidenceFor: string[] = ['warn', 'mute', 'ban', 'kick']

    constructor(
        @inject(delay(() => Database)) private db: Database,
        @inject(delay(() => Logger)) private logger: Logger,
        @inject(delay(() => EventManager)) private eventManager: EventManager,
        @inject(delay(() => Client)) private client: Client
    ) {
    }

    async createLog(data: TimedAction) {
        const embed = await this.transformers[data.type](data)

        embed.setTitle(`Case \`${data.id}\` \u2022 ${data.type.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ')}`).setTimestamp()

        const messageData = {
            id: data.id,
            type: data.type.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' '),
            description: embed.data.description!,
            color: embed.data.color!,
            now: Date.now(),
        }

        const logChannel = await this.client.channels.fetch(dashboardConfig.modules.moderation.logging.channel).catch(() => null)
        const message = await buildMessage('case-log', messageData)

        if (this.includeEvidenceFor.includes(data.type)) {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
                new ButtonBuilder()
                    .setCustomId(`case-evidence:${data.id}`)
                    .setLabel('Attach evidence')
                    .setEmoji('<:Link:1278487944604291124>')
                    .setStyle(ButtonStyle.Primary),
            ])

            if (!message.components) message.components = []
            message.components = message.components.concat(row)
        }
        if (logChannel
            && logChannel.isTextBased()) {
            (logChannel as TextBasedChannel).send(message).catch(() => null)
        }
    }

}