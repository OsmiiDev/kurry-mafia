/* eslint-disable import/no-mutable-exports */
import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction, GuildMember } from 'discord.js'

import { Discord, Injectable, Slash, SlashOption } from '@/decorators'
import { Guard, UserPermissions } from '@/guards'
import { Database } from '@/services'
import { simpleSuccessEmbed } from '@/utils/functions'

export const mutedWhispers: string[] = []
export let globalWhispersEnabled: boolean = true

@Discord()
@Injectable()
@Category('Admin')
export default class MuteWhispers {

    constructor(
        private _db: Database
    ) {}

    @Slash({ name: 'togglewhispers' })
    @Guard(
        UserPermissions(['Administrator'])
    )
    async togglewhispers(
        @SlashOption({ name: 'user', type: ApplicationCommandOptionType.User }) user: GuildMember,
        interaction: CommandInteraction
    ) {
        const guild = interaction.guild
        if (!guild) return

        const member = await guild.members.fetch(user.id)

        if (mutedWhispers.includes(member.id)) {
            mutedWhispers.splice(mutedWhispers.indexOf(member.id), 1)

            return simpleSuccessEmbed(interaction, `Whispers unmuted for ${member.user.tag}.`)
        }

        mutedWhispers.push(member.id)

        return simpleSuccessEmbed(interaction, `Whispers muted for ${member.user.tag}.`)
    }

    @Slash({ name: 'toggleallwhispers' })
    @Guard(
        UserPermissions(['Administrator'])
    )
    async toggleallwhispers(
        interaction: CommandInteraction
    ) {
        const guild = interaction.guild
        if (!guild) return

        if (!globalWhispersEnabled) {
            globalWhispersEnabled = true

            return simpleSuccessEmbed(interaction, `Whispers unmuted globally.`)
        }

        globalWhispersEnabled = false

        return simpleSuccessEmbed(interaction, `Whispers muted globally.`)
    }

}
