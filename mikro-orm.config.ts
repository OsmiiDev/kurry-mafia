// @ts-nocheck

import { Options } from '@mikro-orm/core'
import { Migrator } from '@mikro-orm/migrations'

import * as entities from '@/entities'
import { env } from '@/env'

import { mikroORMConfig } from './src/configs/database'

export default defineConfig({
    ...mikroORMConfig[env.NODE_ENV || 'production'] as Options<DatabaseDriver>,
    entities: [...Object.values(entities), ...pluginsManager.getEntities()],
    extensions: [Migrator],
})
