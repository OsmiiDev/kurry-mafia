import { CommandInteraction, ContextMenuCommandInteraction, EmbedBuilder } from 'discord.js'
import { ArgsOf, GuardFunction, SimpleCommandMessage } from 'discordx'

import { getLocaleFromInteraction, L } from '@/i18n'
import { getColor, isDev, isInMaintenance, replyToInteraction, resolveUser, simpleErrorEmbed } from '@/utils/functions'

/**
 * Prevent interactions from running when bot is in maintenance
 */
export const Maintenance: GuardFunction<
    | ArgsOf<'messageCreate' | 'interactionCreate'>
> = async (arg, client, next) => {
	if (
		arg instanceof CommandInteraction
		|| arg instanceof SimpleCommandMessage
		|| arg instanceof ContextMenuCommandInteraction
	) {
		const user = resolveUser(arg)
		const maintenance = await isInMaintenance()

		if (
			maintenance
			&& user?.id
			&& !isDev(user.id)
		) {
			const locale = getLocaleFromInteraction(arg)
			const localizedReplyMessage = L[locale].GUARDS.MAINTENANCE()

			if (arg instanceof CommandInteraction)
				await simpleErrorEmbed(arg, localizedReplyMessage, true)

			const embed = new EmbedBuilder()
				.setColor(getColor('red')) // RED // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
				.setTitle(`<:Failure:1087891244874748067> ${localizedReplyMessage}`)

			if (arg instanceof SimpleCommandMessage)
				await replyToInteraction(arg, { embeds: [embed] })
		} else {
			return next()
		}
	} else {
		return next()
	}
}
