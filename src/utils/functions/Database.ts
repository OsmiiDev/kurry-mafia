import { Data } from '@/entities'
import { Database } from '@/services'
import { resolveDependency } from '@/utils/functions'

const defaultData = {

    maintenance: false,
    lastMaintenance: Date.now(),
    lastStartup: Date.now(),
}

type DataType = keyof typeof defaultData

/**
 * Initiate the EAV Data table if properties defined in the `defaultData` doesn't exist in it yet.
 */
export async function initDataTable() {
    const db = await resolveDependency(Database)

    for (const key of Object.keys(defaultData)) {
        const dataRepository = db.get(Data)

        await dataRepository.add(
            key as DataType,
            defaultData[key as DataType]
        )
    }
}
