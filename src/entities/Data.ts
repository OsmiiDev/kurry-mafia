import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/sqlite'

import { CustomBaseEntity } from './BaseEntity'

// ===========================================
// ================= Entity ==================
// ===========================================

@Entity({ repository: () => DataRepository })
export class Data extends CustomBaseEntity {

    [EntityRepositoryType]?: DataRepository

    @PrimaryKey()
    key!: string

    @Property()
    value: string = ''

}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class DataRepository extends EntityRepository<Data> {

    defaultData = {

        maintenance: false,
        lastMaintenance: Date.now(),
        lastStartup: Date.now(),
    }

    async get<T extends keyof typeof this.defaultData>(key: T): Promise<typeof this.defaultData[T]> {
        const data = await this.findOne({ key })

        return JSON.parse(data!.value)
    }

    async set<T extends keyof typeof this.defaultData>(key: T, value: typeof this.defaultData[T]): Promise<void> {
        const data = await this.findOne({ key })

        if (!data) {
            const newData = new Data()
            newData.key = key
            newData.value = JSON.stringify(value)

            await this.em.persistAndFlush(newData)
        } else {
            data.value = JSON.stringify(value)
            await this.em.flush()
        }
    }

    async add<T extends keyof typeof this.defaultData>(key: T, value: typeof this.defaultData[T]): Promise<void> {
        const data = await this.findOne({ key })

        if (!data) {
            const newData = new Data()
            newData.key = key
            newData.value = JSON.stringify(value)

            await this.em.persistAndFlush(newData)
        }
    }

}
