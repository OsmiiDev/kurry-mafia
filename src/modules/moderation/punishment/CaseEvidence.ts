import { channel } from 'node:diagnostics_channel'

import { ActionRowBuilder, ButtonInteraction, CategoryChannel, ChannelResolvable, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, GuildChannel, GuildMember, Interaction, ModalBuilder, ModalSubmitInteraction, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, TextInputBuilder, TextInputStyle, VoiceChannel } from 'discord.js'
import { ButtonComponent, Client, Discord, ModalComponent, SimpleCommandMessage } from 'discordx'
import { delay, inject } from 'tsyringe'

import { dashboardConfig } from '@/configs'
import { OnCustom, Service } from '@/decorators'
import { AuditEntry, TimedActionEntity } from '@/entities'
import { L } from '@/i18n'
import { ActionManagerModule, LoggingModule } from '@/modules'
import { Database, EventManager, Logger } from '@/services'
import { buildMessage, resolveDependency, simpleSuccessEmbed, stringToTime, timeToString } from '@/utils/functions'

@Discord()
@Service()
export class CaseEvidenceModule {

    constructor(
        @inject(delay(() => Client)) private client: Client,
        @inject(delay(() => Database)) private db: Database,
        @inject(delay(() => Logger)) private logger: Logger,
        @inject(delay(() => LoggingModule)) private loggingModule: LoggingModule,
        @inject(delay(() => EventManager)) private eventManager: EventManager
    ) {
    }

    async reset() {
    }

    @ButtonComponent({
        id: /^case-evidence:\w+$/,
    })
    async viewEvidenceHandler(interaction: ButtonInteraction) {
        const id = /case-evidence:(\w+)/.exec(interaction.customId)![1]

        const entry = await this.db.get(TimedActionEntity).findOneOrFail({ id })

        const evidence = entry.additionalData?.evidence

        if (!evidence || evidence.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle(`<:Failure:1262210692912648192> No evidence found for case \`${id}\``)

            interaction.reply({ embeds: [embed], ephemeral: true })
        } else {
            console.log(this.client.users)
            const authors = await Promise.all(
                evidence.map((e: { evidence: string, author: string, timestamp: number }) => this.client.users.fetch(e.author))
            )

            const embeds = evidence.map((e: { evidence: string, author: string, timestamp: number }, i: number) => new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`${i === 0 ? `⭐ ` : ''}${e.evidence}`)
                .setFooter({
                    text: `Submitted by ${authors[i].username}`,
                    iconURL: authors[i].displayAvatarURL(),
                })
                .setTimestamp(e.timestamp)
            )

            interaction.reply({ embeds, ephemeral: true })
        }
    }

    @ButtonComponent({
        id: /^case-evidence:\w+:add$/,
    })
    async attachEvidenceHandler(interaction: ButtonInteraction) {
        const id = /case-evidence:(\w+):add/.exec(interaction.customId)![1]

        interaction.showModal(new ModalBuilder()
            .setCustomId(`case-evidence:${id}:confirm`)
            .setTitle('Attach evidence')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`case-evidence:${id}:input`)
                        .setLabel('Evidence')
                        .setPlaceholder('Enter a link, some text, or mention another case with @{id}...')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph)
                )
            )
        )
    }

    @ModalComponent({
        id: /^case-evidence:\w+:confirm$/,
    })
    async attachEvidenceConfirmHandler(interaction: ModalSubmitInteraction) {
        const id = /case-evidence:(\w+):confirm/.exec(interaction.customId)![1]

        const evidence = interaction.fields.getTextInputValue(`case-evidence:${id}:input`)

        const entry = await this.db.get(TimedActionEntity).findOneOrFail({ id })

        console.log(evidence)

        if (!entry.additionalData?.evidence || entry.additionalData?.evidence.length === 0) {
            entry.additionalData!.evidence = []
        }
        entry.additionalData!.evidence.push({
            evidence,
            author: interaction.user.id,
            timestamp: Date.now(),
        })

        await this.db.em.persistAndFlush(entry)

        this.loggingModule.recreateLog(entry)

        const embed = new EmbedBuilder()
            .setColor(0x57F287) // GREEN // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
            .setTitle(`<:Success:1262209405445738557> Successfully attached evidence to case \`${id}\``)

        interaction.reply({ embeds: [embed], ephemeral: true })
    }

}