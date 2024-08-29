import { CommandInteraction, EmbedBuilder } from 'discord.js'
import { ArgsOf, GuardFunction, SimpleCommandMessage } from 'discordx'

import { getLocaleFromInteraction, L } from '@/i18n'
import { replyToInteraction, simpleErrorEmbed, timeToString } from '@/utils/functions'

const interactionTracker = new Map<string, Map<string, number>>()

export function Cooldown(seconds: number) {
    const func: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
        const name = arg instanceof CommandInteraction ? arg.commandName : arg.name
        const user = arg instanceof CommandInteraction ? arg.user : arg.message.author

        if (!interactionTracker.has(name))
            interactionTracker.set(name, new Map())
        if (!interactionTracker.get(name)!.has(user.id))
            interactionTracker.get(name)!.set(user.id, 0)

        console.log(new Date().getTime() - interactionTracker.get(name)!.get(user.id)!)
        if (new Date().getTime() - interactionTracker.get(name)!.get(user.id)! > seconds * 1000) {
            interactionTracker.get(name)!.set(user.id, new Date().getTime())
            await next()
        } else {
            const locale = getLocaleFromInteraction(arg)
            if (arg instanceof CommandInteraction) {
                await simpleErrorEmbed(arg, L[locale].GUARDS.COOLDOWN({
                    time: timeToString(seconds * 1000 - Math.floor((new Date().getTime() - interactionTracker.get(name)!.get(user.id)!) / 1000) * 1000),
                }), true)
            } else {
                await replyToInteraction(arg, { embeds: [new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle(`<:Failure:1262210692912648192> ${L[locale].GUARDS.COOLDOWN({
                        time: timeToString(seconds * 1000 - Math.floor((new Date().getTime() - interactionTracker.get(name)!.get(user.id)!) / 1000) * 1000),
                    })}`)] }, true)
            }
        }
    }

    return func
}