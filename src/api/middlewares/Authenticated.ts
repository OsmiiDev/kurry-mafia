import { Context, Middleware, PlatformContext } from '@tsed/common'
import { BadRequest, Unauthorized } from '@tsed/exceptions'
import DiscordOauth2 from 'discord-oauth2'
import { Client } from 'discordx'
import { inject } from 'tsyringe'

import { dashboardConfig } from '@/configs'
import { Injectable } from '@/decorators'
import { env } from '@/env'
import { Store } from '@/services'
import { resolveDependencies } from '@/utils/functions'

const discordOauth2 = new DiscordOauth2()

const timeout = 10 * 60 * 1000

// const fmaTokenRegex = /mfa\.[\w-]{84}/
// const nonFmaTokenRegex = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/

@Middleware()
@Injectable()
export class Authenticated {

    private store: Store
    private client: Client

    private requiredPermissions: string[]

    constructor(@inject('requiredPermissions') requiredPermissions: string | string[]) {
        this.requiredPermissions = typeof requiredPermissions === 'string' ? [requiredPermissions] : requiredPermissions

        resolveDependencies([Store, Client]).then(([store, client]) => {
            this.store = store
            this.client = client
        })
    }

    async use(@Context() { request }: PlatformContext) {
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer '))
            throw new BadRequest('Missing token')

        const token = authHeader.split(' ')[1]
        if (!token)
            throw new BadRequest('Invalid token')

        // pass if the token is the admin token of the app
        if (token === env.API_ADMIN_TOKEN)
            return

        // verify that the token is a valid FMA protected (or not) OAuth2 token -> https://stackoverflow.com/questions/71166596/is-there-a-way-to-check-if-a-discord-account-token-is-valid-or-not
        // FIXME: doesn't match actual tokens
        // if (!token.match(fmaTokenRegex) && !token.match(nonFmaTokenRegex)) return ctx.throw(400, 'Invalid token')

        // directly skip the middleware if the token is already in the store, which is used here as a "cache"
        const authorizedAPITokens = this.store.get('authorizedAPITokens')
        if (authorizedAPITokens[token]) {
            if (Date.now() - authorizedAPITokens[token].timestamp > timeout) {
                delete authorizedAPITokens[token]
                throw new Unauthorized('Token expired. Please reauthenticate')
            } else if (this.requiredPermissions.some(permission => !authorizedAPITokens[token].permissions.includes(permission))) {
                throw new Unauthorized('Unauthorized')
            } else {
                return
            }
        }

        // we get the user's profile from the token using the `discord-oauth2` package
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

            if (this.requiredPermissions.some(permission => !permissions.includes(permission))) {
                throw new Unauthorized('Unauthorized')
            } else {
                this.store.set('authorizedAPITokens', {
                    ...authorizedAPITokens,
                    token: {
                        timestamp: Date.now(),
                        permissions,
                    },
                })
            }
        } catch (err) {
            console.log(err)
            throw new BadRequest('Invalid discord token')
        }
    }

}

export function createAuthenticated(options: string | string[]) {
    @Middleware()
    class MiddlewareWithConfig extends Authenticated {

        constructor() {
            super(options)
        }

    }

    return MiddlewareWithConfig
}