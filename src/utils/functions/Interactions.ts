import { CommandInteraction, InteractionResponse, Message } from 'discord.js'
import { SimpleCommandMessage } from 'discordx'

import { dashboardConfig } from '@/configs'

/**
 * Abstraction level to reply to either a slash command or a simple command message.
 * @param interaction
 * @param message
 */
export async function replyToInteraction(interaction: CommandInteraction | SimpleCommandMessage, message: string | { [key: string]: any }, ephemeral = false, processAutoDelete = false) {
    let replyMessage: Message | InteractionResponse | void

    if (interaction instanceof CommandInteraction) {
        if (interaction.replied || interaction.deferred)
            replyMessage = await interaction.followUp(typeof message === 'string' ? { content: message, ephemeral } : { ...message, ephemeral })
        else
            replyMessage = await interaction.reply(typeof message === 'string' ? { content: message, ephemeral } : { ...message, ephemeral })
    } else if (interaction instanceof SimpleCommandMessage) {
        replyMessage = await interaction.message.reply(message)
    }

    if (dashboardConfig.modules.moderation.replyAutomaticDeletion.enabled && processAutoDelete) {
        setTimeout(() => {
            if (dashboardConfig.modules.moderation.replyAutomaticDeletion.deleteReply) {
                if (replyMessage instanceof Message) {
                    const ref = replyMessage.fetchReference().catch(() => null)
                    if (ref) ref.then(ref => ref?.delete().catch(() => null))
                }
            }

            replyMessage?.delete().catch(() => null)
        }, dashboardConfig.modules.moderation.replyAutomaticDeletion.delay)
    }
}
