import { readFileSync } from 'node:fs'

import { EmbedBuilder, Message, MessageCreateOptions } from 'discord.js'

import { templatedMessage } from './String'

export async function extractArgs(_message: Message) {
    // @IMPORTANT useless xd
}

export function replaceValues(message: any, variables: Record<string, string | number>): any {
    if (typeof message === 'string') {
        return templatedMessage(message, variables)
    } else if (Array.isArray(message)) {
        return message.map(item => replaceValues(item, variables))
    } else if (typeof message === 'object') {
        const newMessage = { ...message }
        for (const key in newMessage) {
            newMessage[key] = replaceValues(newMessage[key], variables)
        }

        return newMessage
    } else {
        return message
    }
}

export async function buildMessage(id: string, variables: Record<string, string | number>): Promise<MessageCreateOptions> {
    // ensure id fits regex /^[a-z0-9-]+$/gi
    if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('Invalid id')

    const data = readFileSync(`./assets/messages/messages/${id}.json`, 'utf-8')
    const messageJson = JSON.parse(data)

    messageJson.embeds = messageJson.embeds?.map((embed: any) => resolveEmbed(embed))
    messageJson.components = messageJson.components?.map((component: any) => resolveComponent(component))

    const replacedData = replaceValues(messageJson, variables)

    const embeds: EmbedBuilder[] = replacedData.embeds?.map((embed: any) => new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(embed.description)
        .setColor(embed.color)
        .setTimestamp(embed.timestamp)
    )

    const components = replacedData.components?.map((component: any) => component)

    // @TODO add support for components

    return {
        content: replacedData.content,
        embeds,
        components,
    }
}

export function resolveEmbed(id: string) {
    // ensure id fits regex /^[a-z0-9-]+$/gi
    if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('Invalid id')

    const data = readFileSync(`./assets/messages/embeds/${id}.json`, 'utf-8')
    const embedJson = JSON.parse(data)

    return embedJson
}

export function resolveComponent(id: string) {
    // ensure id fits regex /^[a-z0-9-]+$/gi
    if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('Invalid id')

    const data = readFileSync(`./assets/messages/components/${id}.json`, 'utf-8')
    const componentJson = JSON.parse(data)

    return componentJson
}