import { Controller, Get, QueryParams, UseBefore } from '@tsed/common'
import { Required } from '@tsed/schema'
import { Client } from 'discordx'

import { AuditEntry, Data } from '@/entities'
import { Database, HealthMonitor, Logger, Stats } from '@/services'
import { BaseController } from '@/utils/classes'
import { isInMaintenance, resolveDependencies } from '@/utils/functions'

import { createAuthenticated } from '../middlewares/Authenticated'

@Controller('/health')
@UseBefore(
    createAuthenticated('viewHealth')
)
export class HealthController extends BaseController {

    private client: Client
    private db: Database
    private stats: Stats
    private logger: Logger
    private healthMonitor: HealthMonitor

    constructor() {
        super()

        resolveDependencies([Client, Database, Stats, Logger, HealthMonitor]).then(([client, db, stats, logger, healthMonitor]) => {
            this.client = client
            this.db = db
            this.stats = stats
            this.logger = logger
            this.healthMonitor = healthMonitor
        })
    }

    @Get('/check')
    async healthcheck() {
        return {
            online: this.client.user?.presence.status !== 'offline',
            uptime: this.client.uptime,
            lastStartup: await this.db.get(Data).get('lastStartup'),
        }
    }

    @Get('/latency')
    async latency() {
        return this.stats.getLatency()
    }

    @Get('/usage')
    async usage() {
        const body = await this.stats.getPidUsage()

        return body
    }

    @Get('/host')
    async host() {
        const body = await this.stats.getHostUsage()

        return body
    }

    @Get('/monitoring')
    async monitoring() {
        const body = {
            botStatus: {
                online: true,
                uptime: this.client.uptime,
                maintenance: await isInMaintenance(),
            },
            host: await this.stats.getHostUsage(),
            pid: await this.stats.getPidUsage(),
            latency: this.stats.getLatency(),
        }

        return body
    }

    @Get('/monitoringHistory')
    async monitoringHistory(@QueryParams('limit') limit: number) {
        console.log(limit)

        return this.healthMonitor.getHistory(limit)
    }

    @Get('/logs')
    async logs() {
        const body = await this.logger.getLastLogs()

        return body
    }

    @Get('/auditLogs')
    async auditLogs(
@Required() @QueryParams('before') before: number,
@Required() @QueryParams('after') after: number,
@QueryParams('mentions') mentions: string
    ) {
        const audit = await this.db.get(AuditEntry).get({
            afterDate: new Date(after),
            beforeDate: new Date(before),
            mentions: mentions ? [mentions] : undefined,
        })

        return audit
    }

}
