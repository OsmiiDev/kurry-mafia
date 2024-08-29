type GeneralConfigType = {

    name: string
    description: string
    defaultLocale: import('@/i18n').Locales
    ownerId: string
    timezone: string
    automaticUploadImagesToImgur: boolean

    simpleCommandsPrefix: string
    automaticDeferring: boolean

    links: {
        invite: string
        supportServer: string
        gitRemoteRepo: string
    }

    devs: string[]

    activities: {
        text: string
        type: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'CUSTOM' | 'COMPETING'
    }[]

}

type DatabaseConfigType = {

    path: `${string}/`

    backup: {
        enabled: boolean
        path: `${string}/`
    }
}

type LogsConfigType = {

    debug: boolean
    logTailMaxSize: number

    archive: {
        enabled: boolean
        retention: number
    }

    interaction: {
        file: boolean
        console: boolean
        channel: string | null

        exclude: InteractionsConstants[]
    }

    simpleCommand: {
        file: boolean
        console: boolean
        channel: string | null
    }

    newUser: {
        file: boolean
        console: boolean
        channel: string | null
    }

    guild: {
        file: boolean
        console: boolean
        channel: string | null
    }

    error: {
        file: boolean
        console: boolean
        channel: string | null
    }
}

type StatsConfigType = {

    interaction: {

        exclude: InteractionsConstants[]
    }
}

type APIConfigType = {

    enabled: boolean
    port: number
}

type DashboardConfigType = {
    permissions: {
        groups: {
            roles: string[]
            permissions: {
                viewLogs: boolean
                viewHealth: boolean

                manageSettings: boolean
                managePermissions: boolean
                [key: string]: boolean
            }
        }[]
    }

    modules: {
        welcome: {

            enabled: boolean
            channel: string | null
            message: string | null
            grantRole: string | null
        }

        moderation: {
            enabled: boolean
            replyAutomaticDeletion: {
                enabled: boolean
                delay: number
                deleteReply: boolean
            }

            punishments: {
                warn: {
                    enabled: boolean
                    expireAfter: number
                }
            }

            slowmode: {
                enabled: boolean
                globalChannels: string[]
            }
            logging: {
                enabled: boolean
                channel: string
            }
        }
    }
}