import { Category } from '@discordx/utilities'
import { CommandInteraction, EmbedBuilder, Message } from 'discord.js'
import { Client } from 'discordx'

import { Discord, Slash } from '@/decorators'

@Discord()
@Category('General')
export default class PingCommand {

	@Slash({
		name: 'ping',
	})
	async ping(
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		await interaction.deferReply()

		const msg = (await interaction.followUp({ content: 'Pinging...', fetchReply: true })) as Message

		const content = localize.COMMANDS.PING.MESSAGE({
			time: msg.createdTimestamp - interaction.createdTimestamp,
		})

		const embed = new EmbedBuilder()
			.setColor(0x57F287) // GREEN // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
			.setDescription(`<:Success:1087892239449075712> ${content}`)
		await msg.edit({ content: '', embeds: [embed] })
	}

}
