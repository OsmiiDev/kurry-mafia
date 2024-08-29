import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import { Client } from 'discordx'

import { generalConfig } from '@/configs'
import { Discord, Injectable, Slash, SlashOption } from '@/decorators'
import { Guild } from '@/entities'
import { MissingPermissionsError, UnknownReplyError } from '@/errors'
import { Guard, UserPermissions } from '@/guards'
import { Database } from '@/services'
import { resolveGuild, simpleErrorEmbed, simpleSuccessEmbed } from '@/utils/functions'

@Discord()
@Injectable()
@Category('Admin')
export default class PrefixCommand {

    constructor(
        private db: Database
    ) {}

    @Slash({ name: 'flag' })
    @Guard(
        UserPermissions(['Administrator'])
    )
    async flag(
        interaction: CommandInteraction
    ) {
        throw new MissingPermissionsError(interaction, 'Administrator')
    }

}
