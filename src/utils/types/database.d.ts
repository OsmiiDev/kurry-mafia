type DatabaseSize = {
    db: number | null
    backups: number | null
    maximum: number | null
}

type DatabaseConfigs = {
    'sqlite': {
        driver: import('@mikro-orm/sqlite').SqliteDriver
        entityManager: import('@mikro-orm/sqlite').SqlEntityManager
    }
    'better-sqlite': {
        driver: import('@mikro-orm/better-sqlite').BetterSqliteDriver
        entityManager: import('@mikro-orm/better-sqlite').SqlEntityManager
    }
    'postgresql': {
        driver: import('@mikro-orm/postgresql').PostgreSqlDriver
        entityManager: import('@mikro-orm/postgresql').SqlEntityManager
    }
    'mysql': {
        driver: import('@mikro-orm/mysql').MySqlDriver
        entityManager: import('@mikro-orm/mysql').SqlEntityManager
    }
    'mariadb': {
        driver: import('@mikro-orm/mariadb').MariaDbDriver
        entityManager: import('@mikro-orm/mariadb').SqlEntityManager
    }
    'mongo': {
        driver: import('@mikro-orm/mongodb').MongoDriver
        entityManager: import('@mikro-orm/mongodb').MongoEntityManager
    }

    [key: string]: {
        driver: import('@mikro-orm/core').IDatabaseDriver
        entityManager: import('@mikro-orm/core').EntityManager
    }
}
