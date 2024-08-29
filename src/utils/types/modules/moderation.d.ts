type TimedActionType = 'ban' | 'unban' | 'mute' | 'unmute' | 'kick' | 'warn' | 'note' | 'slowmode' | 'reset-slowmode' | 'reset-warn' | 'delete-note'

type TimedAction = {
    id: string

    type: TimedActionType

    guildId: string
    userId: string | null
    moderatorId: string

    reason: string

    startTime: number
    endTime: number

    additionalData: any | null
}

type UnparsedTimedAction = {
    type: TimedActionType

    guildId: string
    userId: string | null
    moderatorId: string

    reason: string

    length: number

    additionalData: any | null
}