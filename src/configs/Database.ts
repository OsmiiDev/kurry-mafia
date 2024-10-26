import { BetterSqliteDriver, SqlEntityManager } from '@mikro-orm/better-sqlite'
import { Options } from '@mikro-orm/core'
import { SqlHighlighter } from '@mikro-orm/sql-highlighter'

type Config = {
    production: Options
    development?: Options
}

export const databaseConfig: DatabaseConfigType = {

    path: './database/', // path to the folder containing the migrations and SQLite database (if used)

    // config for setting up an automated backup of the database (ONLY FOR SQLITE)
    backup: {
        enabled: false,
        path: './database/backups/', // path to the backups folder (should be in the database/ folder)
    },
}

const envMikroORMConfig = {

    production: {

        /**
         * PostgreSQL
         */
        // type: 'postgresql',
        // dbName: env['DATABASE_NAME'],
        // host: env['DATABASE_HOST'],
        // port: Number(env['DATABASE_PORT']),,
        // user: env['DATABASE_USER'],
        // password: env['DATABASE_PASSWORD'],

        driver: BetterSqliteDriver,
        entityManager: SqlEntityManager,
        dbName: `${databaseConfig.path}db.sqlite`,
        driverOptions: {

        },

        highlighter: new SqlHighlighter(),
        debug: false,

        migrations: {
            path: './database/migrations',
            emit: 'js',
            snapshot: true,
        },

        tsNode: true,
    },

    development: {
        driver: BetterSqliteDriver,
        entityManager: SqlEntityManager,
        dbName: `${databaseConfig.path}db.sqlite`,
        name: 'default',

        highlighter: new SqlHighlighter(),
        debug: true,

        migrations: {
            path: './database/migrations',
            emit: 'js',
            snapshot: true,
        },

        tsNode: true,
    },

} satisfies Config

export const mikroORMConfig = envMikroORMConfig as {
    production: typeof envMikroORMConfig['production']
    development: typeof envMikroORMConfig['development']
}
