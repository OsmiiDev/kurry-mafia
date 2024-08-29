import { Category } from '@discordx/utilities'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, EmbedField, GuildChannel } from 'discord.js'
import { Client, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'

import { generalConfig } from '@/configs'
import { Discord, Injectable, Slash } from '@/decorators'
import { Cooldown, Guard, GuildOnly } from '@/guards'
import { L } from '@/i18n'
import { Stats } from '@/services'
import { getColor, getTscordVersion, hasCommandPermission, isValidUrl, replyToInteraction, resolveDependency, timeAgo } from '@/utils/functions'

import packageJson from '../../../package.json'

dayjs.extend(relativeTime)

@Discord()
@Injectable()
@Category('General')
export default class InfoCommand {

    client: Client

    constructor() {
        resolveDependency(Client).then(client => this.client = client)
    }

    @SimpleCommand({ name: 'info' })
    @Guard(GuildOnly, Cooldown(3))
    async infoCommand(
            @SimpleCommandOption({ name: 'category', type: SimpleCommandOptionType.String }) category: string | undefined,
            command: SimpleCommandMessage
    ) {
        const assoc = (await command.message.guild!.commands.fetch()).find(cmd => cmd.name === 'help')
        if (!(await hasCommandPermission(command.message.member!, command.message.channel as GuildChannel, assoc!, this.client))) return

        this.execute(command)
    }

    @Slash({
        name: 'info',
    })
    @Guard(Cooldown(3))
    async info(
        interaction: CommandInteraction
    ) {
        this.execute(interaction)
    }

    async execute(interaction: CommandInteraction | SimpleCommandMessage) {
        const embed = new EmbedBuilder()
            .setTitle(L.en.COMMANDS.INFO.EMBED.TITLE())
            .setThumbnail(this.client.user!.displayAvatarURL())
            .setColor(getColor('primary'))
            .setDescription(packageJson.description)

        const fields: EmbedField[] = []

        const owner = await this.client.users.fetch(generalConfig.ownerId).catch(() => null)
        if (owner) {
            fields.push({
                name: 'Developer',
                value: `\`${owner.tag}\``,
                inline: true,
            })
        }

        const uptime = `<t:${Math.floor(new Date(Date.now() - this.client.uptime!).getTime() / 1000)}:R>`
        fields.push({
            name: 'Up since',
            value: uptime,
            inline: true,
        })

        fields.push({
            name: 'Bot version',
            value: `v${packageJson.version}`,
            inline: true,
        })

        embed.addFields(fields)

        replyToInteraction(interaction, {
            embeds: [embed],
        })
    }

}
