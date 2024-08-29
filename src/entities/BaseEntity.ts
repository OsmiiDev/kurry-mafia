import { EntityRepository } from '@mikro-orm/better-sqlite'
import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

export abstract class CustomBaseEntity {

    @Property()
    createdAt: Date = new Date()

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date()

}