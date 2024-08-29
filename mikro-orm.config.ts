// @ts-nocheck

import { Options } from '@mikro-orm/core'
import { Migrator } from '@mikro-orm/migrations'

import * as entities from '@/entities'
import { env } from '@/env'
import { PluginsManager } from '@/services'
import { resolveDependency } from '@/utils/functions'

import { mikroORMConfig } from './src/configs/database'

// export async () => {
//     const pluginsManager = await resolveDependency(PluginsManager)
//     await pluginsManager.loadPlugins()

//     console.log('using from', Object.values(entities))

//     return {
//         ...mikroORMConfig[env.NODE_ENV || 'production'] as Options<DatabaseDriver>,
//         entities: [...Object.values(entities), ...pluginsManager.getEntities()],
//         extensions: [Migrator],
//     }
// }

export default defineConfig({
    ...mikroORMConfig[env.NODE_ENV || 'production'] as Options<DatabaseDriver>,
    entities: [...Object.values(entities), ...pluginsManager.getEntities()],
    extensions: [Migrator],
})
