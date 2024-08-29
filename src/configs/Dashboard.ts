import { readFileSync } from 'node:fs'

// eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
export const dashboardConfig: DashboardConfigType = JSON.parse(readFileSync('./assets/config.json', 'utf-8'))

export function reloadDashboardConfig(): void {
    // eslint-disable-next-line global-require
    const config = readFileSync('./assets/config.json', 'utf-8')
    dashboardConfig.modules = JSON.parse(config).modules
    dashboardConfig.permissions = JSON.parse(config).permissions
}