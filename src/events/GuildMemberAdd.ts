import { ArgsOf, Client } from 'discordx'

import { Discord, On } from '@/decorators'
import { syncGuild } from '@/utils/functions'

@Discord()
export default class GuildMemberAddEvent {

    @On('guildMemberAdd')
    async guildCreateHandler(
        [_]: ArgsOf<'guildMemberAdd'>,
        _client: Client
    ) {
        console.log('guildMemberAdd')
    }

}
