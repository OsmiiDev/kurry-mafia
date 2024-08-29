import { Entity, EntityRepositoryType, Loaded, PrimaryKey, Property } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/sqlite'

import { timeAgo } from '@/utils/functions'

import { CustomBaseEntity } from './BaseEntity'

type QueryType = {
    beforeDate?: Date
    afterDate?: Date

    mentions?: string[]
    parameters?: string[]
}

type DataType = {
    action: string
    snowflakes: string[]
    snowflakeTypes: string[]
    parameters: string[]
}

// ===========================================
// ================= Entity ==================
// ===========================================

@Entity({ repository: () => AuditEntryRepository })
export class AuditEntry extends CustomBaseEntity {

    [EntityRepositoryType]?: AuditEntryRepository

    @PrimaryKey({ autoincrement: true })
    key: string

    @Property()
    timestamp: Date = new Date()

    @Property()
    value: DataType = {

        action: '',
        snowflakes: [],
        snowflakeTypes: [],
        parameters: [],
    }

}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class AuditEntryRepository extends EntityRepository<AuditEntry> {

    async get(queryObj: QueryType): Promise<Loaded<AuditEntry, never>[]> {
        const data = await this.find({
            timestamp: {
                $lt: queryObj.beforeDate || undefined,
                $gt: queryObj.afterDate || undefined,
            },
            // value: {
            //     snowflakes: {
            //         $contains: queryObj.mentions || undefined,
            //     },
            //     parameters: {
            //         $contains: queryObj.parameters || undefined,
            //     },
            // },
        })

        return data
    }

    async createEntry(value: DataType): Promise<void> {
        const auditEntry = new AuditEntry()
        auditEntry.timestamp = new Date()
        auditEntry.value = value

        await this.em.persistAndFlush(auditEntry)
    }

}
