import { CommandInteraction } from 'discord.js'

import { getLocaleFromInteraction, L } from '@/i18n'
import { BaseError } from '@/utils/classes'
import { simpleErrorEmbed } from '@/utils/functions'

export class MissingPermissionsError extends BaseError {

    private interaction: CommandInteraction
    private errorMessage: string | undefined

    constructor(interaction: CommandInteraction, message?: string) {
        super(message)

        this.interaction = interaction
        this.errorMessage = message
    }

    handle() {
        const locale = getLocaleFromInteraction(this.interaction)
        simpleErrorEmbed(this.interaction, L[locale].ERRORS.NO_PERMISSION({
            permission: this.errorMessage ?? 'Unknown',
        }))
    }

}
