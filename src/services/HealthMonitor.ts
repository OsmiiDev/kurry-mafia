import { Client } from 'discordx'

import { Service } from '@/decorators'
import { Stats } from '@/services'
import { isInMaintenance } from '@/utils/functions'

@Service()
export class HealthMonitor {

    MONITORING_MAX_HISTORY = 1000

    private monitoringHistory: any[] = []

    constructor(
        private client: Client,
        private stats: Stats
    ) {
    }

    async updateMonitoring() {
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

        this.monitoringHistory.push(body)
        if (this.monitoringHistory.length > this.MONITORING_MAX_HISTORY)
            this.monitoringHistory.shift()
    }

    async initialize() {
        setInterval(() => this.updateMonitoring(), 1000 * 10)
    }

    async getHistory(count: number) {
        return {
            history: this.monitoringHistory.slice(-count),
        }
    }

}