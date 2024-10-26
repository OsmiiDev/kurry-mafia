import { Category } from '@discordx/utilities'
import { Application, ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, GuildMember, Message, SlashCommandStringOption, ThreadChannel, User } from 'discord.js'
import { Client, Guard, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'

import { Discord, Slash, SlashOption } from '@/decorators'
import { Cooldown, GuildOnly } from '@/guards'
import { getColor, simpleErrorEmbed } from '@/utils/functions'

import { globalWhispersEnabled, mutedWhispers } from '../Admin/MuteWhispers'

const memberThreads: { [key: string]: string } = {
    '901970323648438313': '1299225665069125745', // Alexis
    '753000435543048264': '1299174002014556182', // Karn
    '1130623779710705747': '1299175084585652314', // Jolan
    '859243433747283998': '1299173277134094367', // Meo
    '1050499493390459041': '1299205419536879616', // Maxine
    '1184697149246681159': '1299207374334197800', // Waffleroo
    '1272402168682385448': '1299208797847420959', // Pongo
    '1006268983495897218': '1299214405786931291', // Striker
    '342711644260139012': '1299217358262370325', // Avatar
    '849726192583442472': '1299219069295398912', // James
    '1109327792375607377': '1299220838792302664', // Sliperee
    '599634727434977280': '1299223945333182515', // Mysticnote
    '757654193816469647': '1299221646246285332', // Planet Max
    '999826151121895475': '1299226068292468758', // Tilde
    '550657797357043712': '1299226388514996264', // Mia
}

const globalWhisper = ['1299229716754206730']

@Discord()
@Category('General')
export default class WhisperCommand {

    @Slash({
        name: 'whisper',
        description: 'Send a whisper to another player',
    })
    @Guard(GuildOnly, Cooldown(3))
    async whisperCommand(
		@SlashOption({ name: 'user', type: ApplicationCommandOptionType.User, description: 'The user to whisper to', required: true }) user: GuildMember,
		@SlashOption({ name: 'message', type: ApplicationCommandOptionType.String, description: 'What you want to whisper them', required: true }) message: string,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
    ) {
        if (mutedWhispers.includes(interaction.user.id) || !globalWhispersEnabled || !interaction.guild) {
            return simpleErrorEmbed(interaction, 'You cannot send whispers right now.')
        }

        await interaction.deferReply({ ephemeral: true })

        user = await user.fetch()

        const threadId = memberThreads[user.id]
		if(!threadId)  return simpleErrorEmbed(interaction, 'That user isn\'t participating.')
		console.log(threadId);
        const thread = await interaction.guild.channels.fetch(threadId)

        if (!thread?.isTextBased()) return simpleErrorEmbed(interaction, 'An unexpected error occurred. Please report this to osmii!')

        thread.send({
            content: `**${interaction.user.username} whispers to you:** ${message} `,
        })

        interaction.followUp({ content: `**You whisper to ${user.user.username}:** ${message} `, ephemeral: true })

        globalWhisper.forEach(async (ch) => {
            const channel = await interaction.guild?.channels.fetch(ch)
            if (!thread.isTextBased() || !thread.isThread()) return;

            (channel as ThreadChannel).send({
                content: `**${interaction.user.username} whispers to ${user.user.username}:** ${message} `,
            })
        })
    }

}
