import { Category, RateLimit, TIME_UNIT } from '@discordx/utilities'
import { ActionRowBuilder, APISelectMenuOption, ApplicationCommandOptionType, ColorResolvable, CommandInteraction, EmbedBuilder, Guild, GuildChannel, GuildMember, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js'
import { Client, Guard, MetadataStorage, SelectMenuComponent, SimpleCommand, SimpleCommandMessage, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'
import { optional } from 'joi'
import { TranslationFunctions } from 'src/i18n/i18n-types'

import { colorsConfig } from '@/configs'
import { Discord, Slash, SlashChoice, SlashOption } from '@/decorators'
import { Cooldown, GuildOnly } from '@/guards'
import { L } from '@/i18n'
import { chunkArray, getColor, hasCommandPermission, hasCommandPermissionAnywhere, replyToInteraction, resolveDependencies, resolveDependency, resolveGuild, validString } from '@/utils/functions'

@Discord()
@Category('General')
export default class HelpCommand {

    private readonly _categories: Map<string, CommandCategory[]> = new Map()

    client: Client

    constructor() {
        resolveDependency(Client).then(client => this.client = client)

        this.loadCategories()
    }

    @SimpleCommand({ name: 'help' })
    @Guard(GuildOnly, Cooldown(3))
    async helpCommand(
            @SimpleCommandOption({ name: 'category', type: SimpleCommandOptionType.String }) category: string | undefined,
            command: SimpleCommandMessage
    ) {
        const assoc = (await command.message.guild!.commands.fetch()).find(cmd => cmd.name === 'help')
        if (!(await hasCommandPermission(command.message.member!, command.message.channel as GuildChannel, assoc!, this.client))) return

        const locale = L.en
        const embed = (await this.defaultEmbed(this.client, locale, command.message.guild!))
            .setFooter({
                text: `@${command.message.author.username}`,
                iconURL: command.message.author.displayAvatarURL({ forceStatic: false }),
            })
            .setTimestamp()

        const components: any[] = []
        components.push(this.getSelectDropdown('categories', locale).toJSON())

        const options = await command.resolveOptions()
        console.log(options)
        replyToInteraction(command, {
            embeds: [embed],
            components,
        })
    }

    @Slash({
        name: 'help',
    })
    @Guard(GuildOnly, Cooldown(3))
    async help(
		@SlashOption({
		    name: 'category',
		    description: 'The category of commands to get help for.',
		    type: ApplicationCommandOptionType.String,
		    required: false,
		    autocomplete(interaction, _command) {
		        console.log('autocomplete')
		        const commands: CommandCategory[] = MetadataStorage.instance.applicationCommandSlashesFlat as CommandCategory[]
		        const value = interaction.options.getFocused() || ''

		        const categories = new Set<string>()
		        for (const command of commands) {
		            const { category } = command

		            if (!category || !validString(category))
		                continue

		            if (value === '') categories.add(category)
		            if (value && category.toLowerCase().includes(value.toLowerCase()))
		                categories.add(category)
		        }

		        interaction.respond(Array.from(categories).map(category => ({
		            name: category,
		            value: category,
		        })))
		    },
		}) category: string | undefined,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
    ) {
        const embed = await this.getEmbed({ client, interaction, locale: localize })

        const components: any[] = []
        components.push(this.getSelectDropdown(category || 'categories', localize).toJSON())

        if (category && this._categories.has(category)) {
            replyToInteraction(interaction, {
                embeds: [await this.getEmbed({
                    client,
                    interaction,
                    category,
                    locale: localize,
                })],
                components,
            })
        } else {
            replyToInteraction(interaction, {
                embeds: [embed],
                components,
            })
        }
    }

    @SelectMenuComponent({
        id: 'help-category-selector',
    })
    async selectCategory(interaction: StringSelectMenuInteraction, client: Client, { localize }: InteractionData) {
        const category = interaction.values[0]

        const embed = await this.getEmbed({ client, interaction, category, locale: localize })
        const components: any[] = []
        components.push(this.getSelectDropdown(category, localize).toJSON())

        interaction.update({
            embeds: [embed],
            components,
        })
    }

    private async defaultEmbed(client: Client, locale: TranslationFunctions, currentGuild: Guild): Promise<EmbedBuilder> {
        const embed = new EmbedBuilder()
            .setTitle(locale.COMMANDS.HELP.EMBED.TITLE())
            .setDescription(locale.COMMANDS.HELP.EMBED.DESCRIPTION())
            .setColor(getColor('primary'))

        const applicationCommands = [
            ...(await currentGuild.commands.fetch()).values(),
            ...(await client.application!.commands.fetch()).values(),
        ]

        embed.addFields([{
            name: locale.COMMANDS.HELP.EMBED.FIELD_TITLE(),
            value: locale.COMMANDS.HELP.EMBED.FIELD_DESCRIPTION(),
        }])
        for (const category of this._categories) {
            const commands = category[1]
                .map((cmd) => {
                    return `</${
                        cmd.group ? `${cmd.group} ` : ''
                    }${cmd.subgroup ? `${cmd.subgroup} ` : ''
                    }${cmd.name
                    }:${
                        applicationCommands.find(acmd => acmd.name === (cmd.group ? cmd.group : cmd.name))!.id
                    }>`
                })

            embed.addFields([{
                name: locale.COMMANDS.HELP.EMBED.CATEGORY_TITLE({ category: category[0] }),
                value: commands.join(', '),
            }])
        }

        return embed
    }

    private async getEmbed({ client, interaction, category = '', pageNumber = 0, locale }: {
        client: Client
        interaction: CommandInteraction | StringSelectMenuInteraction
        category?: string
        pageNumber?: number
        locale: TranslationFunctions
    }): Promise<EmbedBuilder> {
        const commands = this._categories.get(category)

        // default embed
        if (!commands) {
            const currentGuild = resolveGuild(interaction)

            return (await this.defaultEmbed(client, locale, currentGuild!)).setFooter({
                text: `@${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
            }).setTimestamp()
        }

        // specific embed
        const chunks = chunkArray(commands, 24)
        const maxPage = chunks.length
        const resultsOfPage = chunks[pageNumber]

        const embed = new EmbedBuilder()
            .setTitle(locale.COMMANDS.HELP.EMBED.CATEGORY_TITLE({ category }))
            .setFooter({
                text: `@${interaction.user!.username} • Page ${pageNumber + 1} of ${maxPage}`,
                iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
            })
            .setTimestamp()
            .setColor(colorsConfig.primary as ColorResolvable)

        if (!resultsOfPage)
            return embed

        const currentGuild = resolveGuild(interaction)
        const applicationCommands = [
            ...(currentGuild ? (await currentGuild.commands.fetch()).values() : []),
            ...(await client.application!.commands.fetch()).values(),
        ]

        let noPermission = false
        for (const item of resultsOfPage) {
            const command = applicationCommands.find(acmd => acmd.name === (item.group ? item.group : item.name))
            const hasPermission = await hasCommandPermissionAnywhere(interaction.member as GuildMember, command!, client)
            noPermission = noPermission || !hasPermission

            const { description } = item
            const fieldValue = validString(description) ? description : 'No description'
            const name = `</${item.group ? `${item.group} ` : ''}${item.subgroup ? `${item.subgroup} ` : ''}${item.name}:${command!.id}>`
            const permission = hasPermission ? '' : ' <:NoAccess:1263147446209609779>'

            embed.addFields([{
                name: `${name}${permission}`,
                value: fieldValue,
                inline: false,
            }])
        }

        if (noPermission) {
            embed.setDescription(locale.COMMANDS.HELP.EMBED.NO_PERMISSION())
        }

        return embed
    }

    private getSelectDropdown(defaultValue = 'categories', locale: TranslationFunctions): ActionRowBuilder {
        const optionsForEmbed: APISelectMenuOption[] = []

        optionsForEmbed.push({
            description: locale.COMMANDS.HELP.SELECT_MENU.TITLE(),
            label: 'Categories',
            value: 'categories',
            default: defaultValue === 'categories',
        })

        for (const [category] of this._categories) {
            const description = locale.COMMANDS.HELP.SELECT_MENU.CATEGORY_DESCRIPTION({ category })
            optionsForEmbed.push({
                description,
                label: category,
                value: category,
                default: defaultValue === category,
            })
        }

        const selectMenu = new StringSelectMenuBuilder().addOptions(optionsForEmbed).setCustomId('help-category-selector')

        return new ActionRowBuilder().addComponents(selectMenu)
    }

    loadCategories(): void {
        const commands: CommandCategory[] = MetadataStorage.instance.applicationCommandSlashesFlat as CommandCategory[]

        for (const command of commands) {
            const { category } = command
            if (!category || !validString(category))
                continue

            if (this._categories.has(category)) {
                this._categories.get(category)?.push(command)
            } else {
                this._categories.set(category, [command])
            }
        }
    }

}
