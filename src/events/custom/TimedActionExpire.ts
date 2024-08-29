import { Client } from 'discordx'

import { Discord, Injectable, OnCustom } from '@/decorators'
import { TimedActionEntity } from '@/entities'
import { ActionManagerModule, LoggingModule, SlowmodeModule } from '@/modules'
import { Database } from '@/services'

@Discord()
@Injectable()
export default class TimedActionExpireEvent {

    // =============================
    // ========= Handlers ==========
    // =============================

    constructor(private client: Client, private db: Database, private actionManagerModule: ActionManagerModule, private loggingModule: LoggingModule, private slowmodeModule: SlowmodeModule) {}

    @OnCustom('timedActionExpire')
    async timedActionExpireHandler(data: TimedAction) {
        console.log('timedActionExpireHandler', data)

        this.db.get(TimedActionEntity).expire(data.id)

        const entity = await this.actionManagerModule.createTimedAction({
            type: this.getReverseActionType(data.type) ?? data.type,
            guildId: data.guildId,
            userId: this.client.guilds.cache.get(data.guildId)?.members.me?.id ?? '0',
            moderatorId: this.client.application?.bot?.id ?? '0',
            reason: 'Automatic action expired',
            length: -1,
            additionalData: {
                ...data.additionalData,
            },
        })
    }

    getReverseActionType(type: TimedActionType) {
        switch (type) {
            case 'slowmode':
                return 'reset-slowmode'

            case 'warn':
                return 'reset-warn'

            default:
                return null
        }
    }

}
