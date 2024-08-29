import { channel } from 'node:diagnostics_channel'

import { CategoryChannel, ChannelResolvable, ChatInputCommandInteraction, CommandInteraction, GuildChannel, GuildMember, Interaction, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from 'discord.js'
import { Client, Discord, SimpleCommandMessage } from 'discordx'
import { delay, inject } from 'tsyringe'

import { dashboardConfig } from '@/configs'
import { OnCustom, Service } from '@/decorators'
import { AuditEntry } from '@/entities'
import { L } from '@/i18n'
import { ActionManagerModule } from '@/modules'
import { Database, EventManager, Logger } from '@/services'
import { buildMessage, resolveDependency, stringToTime, timeToString } from '@/utils/functions'

@Discord()
@Service()
export class WarnModule {

    constructor(
        @inject(delay(() => Database)) private client: Client,
        @inject(delay(() => Database)) private db: Database,
        @inject(delay(() => Logger)) private logger: Logger,
        @inject(delay(() => EventManager)) private eventManager: EventManager
    ) {
    }

    async reset() {
    }

    async warn(user: GuildMember, reason: string | undefined, length: string | undefined, command: CommandInteraction | SimpleCommandMessage): Promise<Task[]> {
        reason = reason || L.en.COMMANDS.WARN.REASON()

        const actionManager = await resolveDependency(ActionManagerModule)

        const parsedLength = (length ? stringToTime(length) ?? -1 : dashboardConfig.modules.moderation.punishments.warn.expireAfter) / 1000

        const moderator = command instanceof CommandInteraction ? command.user! : command.message.author!
        const guild = command instanceof CommandInteraction ? command.guild! : command.message.guild!

        const successTasks: Task[] = []
        const failedTasks: Task[] = []

        const db = await resolveDependency(Database)
        db.get(AuditEntry).createEntry({
            action: 'warn',
            snowflakes: [moderator.id, user.id],
            snowflakeTypes: ['user', 'user'],
            parameters: [L.en.COMMANDS.SLOWMODE.REASON(), parsedLength.toString()],
        })

        const timedAction = await actionManager.createTimedAction({
            type: 'warn',
            guildId: guild.id,
            userId: user.id,
            moderatorId: moderator.id,
            reason: reason || L.en.COMMANDS.SLOWMODE.REASON(),
            length: parsedLength * 1000 || -1,
            additionalData: {
                duration: parsedLength,
            },
        })

        if (timedAction) {
            successTasks.push({
                description: L.en.COMMANDS.WARN.EMBED.TASK_SUCCESS_CREATE(),
                success: true,
            })
        } else {
            failedTasks.push({
                description: L.en.COMMANDS.WARN.EMBED.TASK_FAILED_CREATE(),
                success: false,
            })
        }

        const dm = await user.createDM().catch(() => null)
        if (dm) {
            // @TODO attach evidence
            const description = [
                `**Reason:** ${reason}`,
                parsedLength > -1 ? `*Warn expires/expired <t:${Math.floor(Date.now() / 1000 + parsedLength)}:R>*` : null,
            ]
            const data: Record<string, string | number> = {
                id: timedAction.id,
                description: description.filter(x => x).map(x => `> ${x}`).join('\n'),
                // YELLOW
                color: 0xFEE75C,
                now: Date.now(),
            }
            const message = await dm.send(await buildMessage('punishment-warn', data)).catch(() => null)
            if (message) {
                successTasks.push({
                    description: L.en.COMMANDS.WARN.EMBED.TASK_SUCCESS_DM(),
                    success: true,
                })
            }
        } else {
            failedTasks.push({
                description: L.en.COMMANDS.WARN.EMBED.TASK_FAILED_DM(),
                success: false,
            })
        }

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