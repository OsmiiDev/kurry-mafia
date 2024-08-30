import { randomUUID } from 'node:crypto'

import { Category } from '@discordx/utilities'
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, ColorResolvable, CommandInteraction, ComponentType, EmbedBuilder, GuildChannel, Message } from 'discord.js'
import { ButtonComponent as XButtonComponent, Client, Guard, SimpleCommand, SimpleCommandMessage } from 'discordx'

import { colorsConfig } from '@/configs'
import { Discord, Slash } from '@/decorators'
import { Cooldown } from '@/guards'
import { getColor, hasCommandPermission, resolveDependency, simpleErrorEmbed } from '@/utils/functions'

import { triviaQuestions } from '../constants'

@Discord()
@Category('Fun')
export default class TriviaCommand {

    client: Client

    constructor() {
        resolveDependency(Client).then(client => this.client = client)
    }

    @XButtonComponent({ id: /trivia-incorrect-.*/ })
    async incorrectHandler(interaction: ButtonInteraction) {
        const ref = interaction.message.reference
        if (ref && ref?.channelId === interaction.channelId) {
            const message = await interaction.channel?.messages.fetch(ref.messageId!).catch(() => null)

            if (message && message.author.id !== interaction.user.id) {
                interaction.reply({
                    embeds: [new EmbedBuilder().setColor(getColor('red')).setTitle('<:Failure:1262210692912648192> You cannot interact with this button.')],
                    ephemeral: true,
                })

                return
            }
        } else if (interaction.message.interaction?.user.id !== interaction.user.id && interaction.message.reference?.messageId !== interaction.id) {
            interaction.reply({
                embeds: [new EmbedBuilder().setColor(getColor('red')).setTitle('<:Failure:1262210692912648192> You cannot interact with this button.')],
                ephemeral: true,
            })

            return
        }

        if (interaction.message.editable) {
            const components = interaction.message.components[0]
            const builder = new ActionRowBuilder<ButtonBuilder>()
            for (const component of components.components) {
                if (!(component instanceof ButtonComponent)) continue

                builder.addComponents([
                    new ButtonBuilder()
                        .setCustomId(randomUUID())
                        .setLabel((component.data as ButtonComponent).label || '')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                ])
            }

            interaction.message.edit({
                components: [builder],
            })

            const embed = new EmbedBuilder()
                .setColor(getColor('red'))
                .setTitle('<:Failure:1262210692912648192> This answer is incorrect.')

            interaction.reply({
                embeds: [embed],
            })
        }
    }

    @XButtonComponent({ id: /trivia-correct-.*/ })
    async correctHandler(interaction: ButtonInteraction) {
        const ref = interaction.message.reference
        if (ref && ref?.channelId === interaction.channelId) {
            const message = await interaction.channel?.messages.fetch(ref.messageId!).catch(() => null)

            if (message && message.author.id !== interaction.user.id) {
                interaction.reply({
                    embeds: [new EmbedBuilder().setColor(getColor('red')).setTitle('<:Failure:1262210692912648192> You cannot interact with this button.')],
                    ephemeral: true,
                })

                return
            }
        } else if (interaction.message.interaction?.user.id !== interaction.user.id && interaction.message.reference?.messageId !== interaction.id) {
            interaction.reply({
                embeds: [new EmbedBuilder().setColor(0xED4245).setTitle('<:Failure:1262210692912648192> You cannot interact with this button.')],
                ephemeral: true,
            })

            return
        }

        if (interaction.message.editable) {
            const components = interaction.message.components[0]
            const builder = new ActionRowBuilder<ButtonBuilder>()
            for (const component of components.components) {
                if (!(component instanceof ButtonComponent)) continue

                builder.addComponents([
                    new ButtonBuilder()
                        .setCustomId(randomUUID())
                        .setLabel((component.data as ButtonComponent).label || '')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                ])
            }

            interaction.message.edit({
                components: [builder],
            })

            const embed = new EmbedBuilder()
                .setColor(getColor('green'))
                .setTitle('<:Success:1262209405445738557> This answer is correct!')

            interaction.reply({
                embeds: [embed],
            })
        }
    }

    @SimpleCommand({ name: 'trivia' })
    @Guard(Cooldown(10))
    async triviaSimpleCommand(command: SimpleCommandMessage) {
        const assoc = (await command.message.guild!.commands.fetch()).find(cmd => cmd.name === 'trivia')
        if (!(await hasCommandPermission(command.message.member!, command.message.channel as GuildChannel, assoc!, this.client))) return

        const message = command.message

        const [question, options] = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)] as [string, string[]]
        const displayedOptions = options.slice(0, -1)

        const embed = new EmbedBuilder()
            .setTitle(question)
            .setDescription(displayedOptions.map((option, index) => `${index + 1}. ${option}`).join('\n'))
            .setColor(colorsConfig.primary as ColorResolvable)

        const components = new ActionRowBuilder<ButtonBuilder>()
        for (const option of displayedOptions) {
            const correct = options[options.length - 1] === option
            components.addComponents([
                new ButtonBuilder()
                    .setCustomId(correct ? `trivia-correct-${randomUUID()}` : `trivia-incorrect-${randomUUID()}`)
                    .setLabel(option)
                    .setStyle(ButtonStyle.Primary),
            ])
        }

        await message.reply({ embeds: [embed], components: [components] })
    }

    @Slash({
        name: 'trivia',
        description: 'Asks a trivia question',
    })
    @Guard(Cooldown(10))
    async trivia(
        interaction: CommandInteraction,
        _client: Client,
        { localize: _localize }: InteractionData
    ) {
        await interaction.deferReply()

        const [question, options] = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)] as [string, string[]]
        const displayedOptions = options.slice(0, -1).sort(() => Math.random() - 0.5)

        const embed = new EmbedBuilder()
            .setTitle(question)
            .setDescription(displayedOptions.map((option, index) => `${index + 1}. ${option}`).join('\n'))
            .setColor(colorsConfig.primary as ColorResolvable)

        const components = new ActionRowBuilder<ButtonBuilder>()
        for (const option of displayedOptions) {
            const correct = options[options.length - 1] === option
            components.addComponents([
                new ButtonBuilder()
                    .setCustomId(correct ? `trivia-correct-${randomUUID()}` : `trivia-incorrect-${randomUUID()}`)
                    .setLabel(option)
                    .setStyle(ButtonStyle.Primary),
            ])
        }

        await interaction.editReply({ embeds: [embed], components: [components] })
    }

}
