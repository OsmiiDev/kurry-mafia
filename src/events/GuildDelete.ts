import { ArgsOf, Client } from 'discordx'

import { Discord, On } from '@/decorators'
import { syncGuild } from '@/utils/functions'

@Discord()
export default class GuildCreateEvent {

    @On('guildMemberAdd')
    async guildCreateHandler(
        [newGuild]: ArgsOf<'guildMemberAdd'>,
        client: Client
    ) {
        console.log('guildMemberAdd in events/')
    }

}
