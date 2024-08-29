import { GuildMember } from 'discord.js'
import { ArgsOf, Client, Discord } from 'discordx'

import { dashboardConfig } from '@/configs'
import { On, Service } from '@/decorators'
import { buildMessage, templatedMessage } from '@/utils/functions'

@Discord()
@Service()
export class WelcomeModule {

    @On('guildMemberAdd')
    async onGuildMemberAdd([member]: ArgsOf<'guildMemberAdd'>) {
        console.log('guildMemberAdd')
        if (!dashboardConfig.modules.welcome.enabled) return

        if (dashboardConfig.modules.welcome.channel) {
            const channel = dashboardConfig.modules.welcome.channel === 'DM'
                ? await member.createDM().catch(() => null)
                : await member.guild.channels.fetch(dashboardConfig.modules.welcome.channel).catch(() => null)
            if (!channel || !channel.isTextBased()) return

            // @TODO Message templates
            await channel.send(await buildMessage('welcome', {
                mention: member.toString(),
                username: member.user.username,
                tag: member.user.tag,
                guild: member.guild.name,
            })) // .catch(() => null)
        }

        if (dashboardConfig.modules.welcome.grantRole) {
            const role = member.guild.roles.cache.get(dashboardConfig.modules.welcome.grantRole)
            if (role) {
                await member.roles.add(role)
                setTimeout(() => {
                    member.roles.remove(role!)
                }, 1000 * 60)
            }
        }
    }

}