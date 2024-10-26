import { BodyParams, Controller, Delete, Get, PathParams, Post, Req, Res, UseBefore } from '@tsed/common'
import { BadRequest, NotFound, Unauthorized } from '@tsed/exceptions'
import { Required } from '@tsed/schema'
import { BaseGuildTextChannel, BaseGuildVoiceChannel, ChannelType, NewsChannel, PermissionsBitField } from 'discord.js'
import DiscordOauth2 from 'discord-oauth2'
import { Client, MetadataStorage } from 'discordx'

import { BotOnline, createAuthenticated } from '@/api/middlewares'
import { dashboardConfig, generalConfig } from '@/configs'
import { Guild, User } from '@/entities'
import { env } from '@/env'
import { Database } from '@/services'
import { BaseController } from '@/utils/classes'
import { getDevs, isDev, isInMaintenance, resolveDependencies, setMaintenance } from '@/utils/functions'

const discordOauth2 = new DiscordOauth2()

@Controller('/bot')
@UseBefore(
    BotOnline,
    createAuthenticated('viewHealth')
)
export class BotController extends BaseController {

    private client: Client

    // test
    private db: Database

    constructor() {
        super()

        resolveDependencies([Client, Database]).then(([client, db]) => {
            this.client = client
            this.db = db
        })
    }

    @Get('/me')
    async permissions(@Req() request: Req) {
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer '))
            throw new BadRequest('Missing token')

        const token = authHeader.split(' ')[1]
        if (!token)
            throw new BadRequest('Invalid token')

        try {
            const user = await discordOauth2.getUser(token)

            const guild = this.client.guilds.cache.get(env.BOT_GUILD_ID) ? this.client.guilds.cache.get(env.BOT_GUILD_ID) : await this.client.guilds.fetch(env.BOT_GUILD_ID).catch(() => null)
            if (!guild)
                throw new BadRequest('It looks like the API server was configured incorrectly. Please contact the bot owner or reconfigure this bot!')

            const member = guild.members.cache.get(user.id) ? guild.members.cache.get(user.id) : await guild.members.fetch(user.id).catch(() => null)

            const permissions: string[] = []

            if (member) {
                permissions.push(...member.permissions.toArray())
                permissions.push(...member.roles.cache.map(role => role.permissions.toArray()).flat())
            } // All DISCORD permissions

            const groups = dashboardConfig.permissions.groups
            groups.forEach((group) => {
                if (member?.roles.cache.some(role => group.roles.includes(role.id))) {
                    permissions.push(...Object.entries(group.permissions).map(([key, value]) => value ? key : null).filter(x => x !== null))
                }
            })

            return {
                user,
                member,
                permissions,
            }
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_error) {
            throw new BadRequest('Invalid discord token')
        }

        // @TODO return the user's permissions
    }

    @Get('/info')
    async info() {
        const user: any = this.client.user?.toJSON()
        if (user) {
            user.iconURL = this.client.user?.displayAvatarURL()
            user.bannerURL = this.client.user?.bannerURL()
        }

        return {
            user,
            owner: (await this.client.users.fetch(generalConfig.ownerId).catch(() => null))?.toJSON(),
        }
    }

    @Get('/commands')
    async commands() {
        const commands = MetadataStorage.instance.applicationCommands

        return commands.map(command => command.toJSON())
    }

    @Get('/guilds')
    async guilds() {
        const body: any[] = []

        for (const discordRawGuild of this.client.guilds.cache.values()) {
            const discordGuild: any = discordRawGuild.toJSON()
            discordGuild.iconURL = discordRawGuild.iconURL()
            discordGuild.bannerURL = discordRawGuild.bannerURL()

            const databaseGuild = await this.db.get(Guild).findOne({ id: discordGuild.id })

            body.push({
                discord: discordGuild,
                database: databaseGuild,
            })
        }

        return body
    }

    @Get('/guilds/:id')
    async guild(@PathParams('id') id: string) {
        // get discord guild
        const discordRawGuild = await this.client.guilds.fetch(id).catch(() => null)
        if (!discordRawGuild)
            throw new NotFound('Guild not found')

        const discordGuild: any = discordRawGuild.toJSON()
        discordGuild.iconURL = discordRawGuild.iconURL()
        discordGuild.bannerURL = discordRawGuild.bannerURL()

        // get database guild
        const databaseGuild = await this.db.get(Guild).findOne({ id })

        return {
            discord: discordGuild,
            database: databaseGuild,
        }
    }

    @Delete('/guilds/:id')
    async deleteGuild(@PathParams('id') id: string) {
        const guild = await this.client.guilds.fetch(id).catch(() => null)
        if (!guild)
            throw new NotFound('Guild not found')

        await guild.leave()

        return {
            success: true,
            message: 'Guild deleted',
        }
    }

    @Get('/guilds/:id/invite')
    async invite(@PathParams('id') id: string) {
        const guild = await this.client.guilds.fetch(id).catch(() => null)
        if (!guild)
            throw new NotFound('Guild not found')

        const guildChannels = await guild.channels.fetch()

        let invite: any
        for (const channel of guildChannels.values()) {
            if (
                channel
                && (guild.members.me?.permissionsIn(channel).has(PermissionsBitField.Flags.CreateInstantInvite) || false)
                && [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement].includes(channel.type)
            ) {
                invite = await (channel as BaseGuildTextChannel | BaseGuildVoiceChannel | NewsChannel | undefined)?.createInvite()
                if (invite)
                    break
            }
        }

        if (invite)
            return invite.toJSON()
        else
            throw new Unauthorized('Missing permission to create an invite in this guild')
    }

    @Get('/users')
    async users() {
        const users: any[] = []
        const guilds = this.client.guilds.cache.values()

        for (const guild of guilds) {
            const members = await guild.members.fetch()

            for (const member of members.values()) {
                if (!users.find(user => user.id === member.id)) {
                    const discordUser: any = member.user.toJSON()
                    discordUser.iconURL = member.user.displayAvatarURL()
                    discordUser.bannerURL = member.user.bannerURL()

                    const databaseUser = await this.db.get(User).findOne({ id: discordUser.id })

                    users.push({
                        discord: discordUser,
                        database: databaseUser,
                    })
                }
            }
        }

        return users
    }

    @Get('/users/:id')
    async user(@PathParams('id') id: string) {
        // get discord user
        const discordRawUser = await this.client.users.fetch(id).catch(() => null)
        if (!discordRawUser)
            throw new NotFound('User not found')

        const discordUser: any = discordRawUser.toJSON()
        discordUser.iconURL = discordRawUser.displayAvatarURL()
        discordUser.bannerURL = discordRawUser.bannerURL()

        // get database user
        const databaseUser = await this.db.get(User).findOne({ id })

        return {
            discord: discordUser,
            database: databaseUser,
        }
    }

    @Get('/users/cached')
    async cachedUsers() {
        return this.client.users.cache.map(user => user.toJSON())
    }

    @Get('/channels/:id')
    async channel(@PathParams('id') id: string) {
        const channel = this.client.channels.cache.get(id)
        if (!channel)
            throw new NotFound('Channel not found')

        return channel.toJSON()
    }

    @Get('/maintenance')
    async maintenance() {
        return {
            maintenance: await isInMaintenance(),
        }
    }

    @Post('/maintenance')
    async setMaintenance(@Required() @BodyParams('maintenance') maintenance: boolean) {
        await setMaintenance(maintenance)

        return {
            maintenance,
        }
    }

    @Post('/kill')
    async kill(@Res() res: Res) {
        res.status(200).send('Bot killed')

        import('node:process').then(({ exit }) => exit(19000))
    }

    @Get('/devs')
    async devs() {
        return getDevs()
    }

    @Get('/devs/:id')
    async dev(@PathParams('id') id: string) {
        return isDev(id)
    }

}
