import { channel } from 'node:diagnostics_channel'

import { CategoryChannel, ChannelResolvable, ChatInputCommandInteraction, CommandInteraction, GuildChannel, Interaction, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from 'discord.js'
import { Client, Discord, SimpleCommandMessage } from 'discordx'
import { delay, inject } from 'tsyringe'

import { OnCustom, Service } from '@/decorators'
import { AuditEntry } from '@/entities'
import { L } from '@/i18n'
import { ActionManagerModule } from '@/modules'
import { Database, EventManager, Logger } from '@/services'
import { resolveDependency, stringToTime, timeToString } from '@/utils/functions'

@Discord()
@Service()
export class SlowmodeModule {

    adaptive: ChannelResolvable[] = []

    constructor(
        @inject(delay(() => Database)) private client: Client,
        @inject(delay(() => Database)) private db: Database,
        @inject(delay(() => Logger)) private logger: Logger,
        @inject(delay(() => EventManager)) private eventManager: EventManager
    ) {
    }

    async reset() {
    }

    async updateSlowmode(channels: GuildChannel[], reason: string | undefined, time: string | undefined, length: string | undefined, command: CommandInteraction | SimpleCommandMessage): Promise<Task[]> {
        const actionManager = await resolveDependency(ActionManagerModule)

        time = time || '0s'
        length = length || 'permanent'

        const channelIds = channels.map(channel => channel.id)
        const moderator = command instanceof CommandInteraction ? command.user! : command.message.author!
        const guild = command instanceof CommandInteraction ? command.guild! : command.message.guild!

        let successTasks: Task[] = []
        const failedTasks: Task[] = []

        const before: Record<string, number | null> = {}

        for (const channel of channels) {
            if (channel.isTextBased()) {
                before[channel.id] = channel.rateLimitPerUser

                await channel.setRateLimitPerUser(Math.floor((stringToTime(time) || 0) / 1000), reason || L.en.COMMANDS.SLOWMODE.REASON())
                    .then(() => {
                        successTasks.push({
                            description: L.en.COMMANDS.SLOWMODE.EMBED.TASK_SUCCESS_SINGLE({
                                channel_id: channel.id,
                            }),
                            success: true,
                        })
                    }).catch(() => {
                        failedTasks.push({
                            description: L.en.COMMANDS.SLOWMODE.EMBED.TASK_FAILED_SINGLE({
                                channel_id: channel.id,
                            }),
                            success: false,
                        })
                    })
            }
        }

        const db = await resolveDependency(Database)
        db.get(AuditEntry).createEntry({
            action: 'slowmode',
            snowflakes: [moderator.id, ...channelIds],
            snowflakeTypes: ['user', ...channelIds.map(() => 'channel')],
            parameters: [L.en.COMMANDS.SLOWMODE.REASON(), time, 'Permanent'],
        })

        if (successTasks.length > 5) {
            successTasks = [
                {
                    description: L.en.COMMANDS.SLOWMODE.EMBED.TASK_SUCCESS_MULTIPLE({
                        channels: successTasks.length,
                    }),
                    success: true,
                },
            ]
        }

        if (failedTasks.length > 5) {
            failedTasks.push({
                description: L.en.COMMANDS.SLOWMODE.EMBED.TASK_FAILED_MULTIPLE({
                    channels: failedTasks.length,
                }),
                success: false,
            })
        }

        const timeText = time === 'adaptive' ? 'Adaptive' : timeToString(stringToTime(time) || 0)
        const lengthText = 'Indefinite'

        actionManager.createTimedAction({
            type: 'slowmode',
            guildId: guild.id,
            userId: moderator.id,
            moderatorId: moderator.id,
            reason: reason || L.en.COMMANDS.SLOWMODE.REASON(),
            length: stringToTime(length) || -1,
            additionalData: {
                channels: channelIds,
                before,
                after: Math.floor((stringToTime(time) || 0) / 1000),
            },
        })

        return [...successTasks, ...failedTasks]
    }

    @OnCustom('timedActionExpire')
    async timedActionExpireHandler(data: TimedAction) {
        if (data.type !== 'slowmode') return

        for (const channelId of data.additionalData.channels) {
            const channel = await this.client.channels.fetch(channelId).catch(() => null)
            if (!channel) continue

            if (channel.isTextBased() && data.additionalData.before[channelId]) {
                if (channel instanceof CategoryChannel || !(channel instanceof GuildChannel)) continue
                await channel.setRateLimitPerUser(data.additionalData.before[channelId], 'Automatic action expired').catch(() => null)
            }
        }
    }

}