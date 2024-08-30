import { ColorResolvable, CommandInteraction, EmbedBuilder } from 'discord.js'
import { SimpleCommandMessage } from 'discordx'

import { colorsConfig } from '@/configs'
import { getColor, replyToInteraction } from '@/utils/functions'

/**
 * Send a simple success embed
 * @param interaction - discord interaction
 * @param message - message to log
 */
export function simpleSuccessEmbed(interaction: CommandInteraction | SimpleCommandMessage, message: string, ephemeral = true) {
    const embed = new EmbedBuilder()
        .setColor(getColor('green')) // GREEN // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
        .setTitle(`<:Success:1262209405445738557> ${message}`)

    replyToInteraction(interaction, { embeds: [embed] }, ephemeral)
}

/**
 * Send a simple error embed
 * @param interaction - discord interaction
 * @param message - message to log
 */
export function simpleErrorEmbed(interaction: CommandInteraction | SimpleCommandMessage, message: string, ephemeral = true) {
    const embed = new EmbedBuilder()
        .setColor(getColor('red')) // RED // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
        .setTitle(`<:Failure:1262210692912648192> ${message}`)

    replyToInteraction(interaction, { embeds: [embed] }, ephemeral)
}

type TaskEmbedItem = {
    reason?: string
}

export function taskEmbed(builder: EmbedBuilder, items: { success: boolean, description: string }[], data: TaskEmbedItem) {
    const itemText = items.map(item => `${item.success ? '> <:Success:1262209405445738557>' : '> <:Failure:1262210692912648192>'} ${item.description}`).join('\n')

    let dataText = ''
    if (data.reason) dataText += `> <:TextBox:1262208527750135860> **Reason:** ${data.reason}`
    dataText += `\n${itemText}`

    dataText = dataText.trim()
    builder.addFields([
        {
            name: 'Info',
            value: `> ${builder.data.description || '*No additional information*'}` || '',
        },
        {
            name: 'Details',
            value: dataText,
        },
    ])
    builder.setDescription(null)
    builder.setColor(getColor('primary'))

    return builder
}