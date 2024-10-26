import { getRandomValues, randomBytes, randomInt } from 'node:crypto'

import { Entity, EntityRepositoryType, PrimaryKey, Property } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/sqlite'

import { CustomBaseEntity } from './BaseEntity'

// ===========================================
// ================= Entity ==================
// ===========================================

@Entity({ repository: () => PlayerRepository })
export class PlayerEntity extends CustomBaseEntity {

    [EntityRepositoryType]?: PlayerRepository

    @PrimaryKey()
    id!: string

    @Property({ nullable: true, type: 'json' })
    data: {[key: string]: any} | null

}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class PlayerRepository extends EntityRepository<PlayerEntity> {


}
