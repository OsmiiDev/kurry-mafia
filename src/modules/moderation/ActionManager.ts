import { Interaction, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from 'discord.js'
import { Discord } from 'discordx'
import { delay, inject } from 'tsyringe'

import { Injectable, Service } from '@/decorators'
import { TimedActionEntity, TimedActionRepository } from '@/entities'
import { Database, EventManager, Logger } from '@/services'
import { resolveDependency } from '@/utils/functions'

import { LoggingModule } from './Logging'
import { SlowmodeModule } from './Slowmode'

@Service()
export class ActionManagerModule {

    constructor(
        @inject(delay(() => Database)) private db: Database,
        @inject(delay(() => Logger)) private logger: Logger,
        @inject(delay(() => EventManager)) private eventManager: EventManager,

        @inject(delay(() => LoggingModule)) private loggingModule: LoggingModule,
        @inject(delay(() => SlowmodeModule)) private slowmodeModule: SlowmodeModule
    ) {
    }

    async createTimedAction(data: UnparsedTimedAction): Promise<TimedActionEntity> { 
        const entity = await this.db.get(TimedActionEntity).createTimedAction(data)
        this.loggingModule.createLog(entity)

        if (data.length === -1) return entity

        this.timeoutUntil(async () => {
            this.eventManager.emit('timedActionExpire', entity)
        }, entity.endTime)

        return entity
    }

    async init() {
        this.db.get(TimedActionEntity).getAllUnexpiredActions().then((actions) => {
            this.logger.log(`Loaded ${actions.length} unexpired timed actions`)
            for (const action of actions) {
                this.timeoutUntil(async () => {
                    this.eventManager.emit('timedActionExpire', action)
                }, action.endTime)
            }
        })
    }

    private async timeoutUntil(callback: () => void, endTime: number) {
        if (endTime - Date.now() > 2147483647) {
            setTimeout(() => this.timeoutUntil(callback, endTime), 2147483647)
        } else {
            setTimeout(callback, endTime - Date.now())
        }
    }

}