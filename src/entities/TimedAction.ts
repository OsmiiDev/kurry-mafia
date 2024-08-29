import { getRandomValues, randomBytes, randomInt } from 'node:crypto'

import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/sqlite'

import { CustomBaseEntity } from './BaseEntity'

// ===========================================
// ================= Entity ==================
// ===========================================

@Entity({ repository: () => TimedActionRepository })
export class TimedActionEntity extends CustomBaseEntity {

    [EntityRepositoryType]?: TimedActionRepository

    @PrimaryKey()
    id!: string

    @Property()
    type: TimedActionType

    @Property()
    guildId: string

    @Property({ nullable: true })
    userId: string | null

    @Property()
    moderatorId: string

    @Property()
    reason: string

    @Property()
    startTime: number

    @Property()
    endTime: number

    @Property()
    expired: boolean = false

    @Property({ nullable: true })
    additionalData: string | null

}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class TimedActionRepository extends EntityRepository<TimedActionEntity> {

    async getAllUnexpiredActions(): Promise<TimedAction[]> {
        const data = await this.find({ endTime: {
            $ne: -1,
        }, expired: false })

        const actions: TimedAction[] = []

        for (const action of data) {
            actions.push({
                id: action.id,
                type: action.type,
                guildId: action.guildId,
                userId: action.userId,
                moderatorId: action.moderatorId,
                reason: action.reason,
                startTime: action.startTime,
                endTime: action.endTime,
                additionalData: JSON.parse(action.additionalData || '{}'),
            })
        }

        return actions
    }

    async createTimedAction(action: UnparsedTimedAction): Promise<TimedActionEntity> {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const id = Array(8).fill(0).map(() => alpha[randomInt(0, alpha.length - 1)]).join('')

        const entity = new TimedActionEntity()

        entity.type = action.type
        entity.guildId = action.guildId
        entity.userId = action.userId
        entity.moderatorId = action.moderatorId
        entity.reason = action.reason
        entity.startTime = new Date().getTime()
        entity.endTime = action.length === -1 ? -1 : entity.startTime + action.length
        entity.additionalData = JSON.stringify(action.additionalData)
        entity.id = id

        await this.em.persistAndFlush(entity)

        entity.additionalData = JSON.parse(entity.additionalData)

        return entity
    }

    async expire(id: string) {
        const entity = await this.findOneOrFail(id)

        entity.expired = true

        await this.em.persistAndFlush(entity)
    }

}
