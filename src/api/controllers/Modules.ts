import { writeFileSync } from 'node:fs'

import { BodyParams, Controller, Get, Post, UseBefore } from '@tsed/common'
import { Required } from '@tsed/schema'

import { createAuthenticated } from '@/api/middlewares'
import { dashboardConfig } from '@/configs'
import { BaseController } from '@/utils/classes'

@Controller('/modules')
export class ModulesController extends BaseController {

    @Get('/all')
    @UseBefore(
        createAuthenticated('manageSettings')
    )
    async allConfig() {
        return dashboardConfig
    }

    @Post('/all')
    @UseBefore(
        createAuthenticated('manageSettings')
    )
    async allConfigPost(
        @Required() @BodyParams('config') config: object
    ) {
        if (config === null || typeof config !== 'object' || JSON.stringify(config) === '{}') return
        const configString = JSON.stringify(config, null, 4)
        dashboardConfig.modules = JSON.parse(configString)

        writeFileSync('./assets/config.json', JSON.stringify(dashboardConfig, null, 4))

        return dashboardConfig
    }

}
