const times = {
    ms: 1,

    s: 1_000,
    m: 60_000,
    h: 60_000 * 60,

    d: 60_000 * 60 * 24,
    w: 60_000 * 60 * 24 * 7,
    mo: 60_000 * 60 * 24 * 30,

    y: 60_000 * 60 * 24 * 365,
}

export function stringToTime(time: string) {
    if (time === 'permanent') return -1

    if (!Number.isNaN(Number(time))) return Number(time) * times.s
    if (time.toLowerCase().match(/(?<number>\d+)(?<unit>[a-z]+)/g) === null) return null
    const units = time.toLowerCase()
        .match(/(?<number>\d+)(?<unit>[a-z]+)/g)
        ?.map((item) => {
            const number = Number.parseInt(item.match(/\d+/)![0])
            const unit = item.match(/[a-z]+/)![0]
            console.log(number, unit)

            return { number, unit }
        })

    // if any invalid units are found, return null
    if (units?.some(unit => !times[unit.unit as keyof typeof times])) return -1

    return units?.reduce((acc, curr) => acc + curr.number * (times[curr.unit as keyof typeof times] ?? 0), 0)
}

export function timeToString(time: number, verbose = false) {
    if (time < 0) return 'Invalid time'
    if (time === 0) return '0s'

    const years = Math.floor(time / times.y)
    time -= years * times.y
    const months = Math.floor(time / times.mo)
    time -= months * times.mo
    const days = Math.floor(time / times.d)
    time -= days * times.d
    const hours = Math.floor(time / times.h)
    time -= hours * times.h
    const minutes = Math.floor(time / times.m)
    time -= minutes * times.m
    const seconds = Math.floor(time / times.s)
    time -= seconds * times.s
    const milliseconds = time

    let string = ''
    if (years) string += verbose ? `${years} year${years > 1 ? 's' : ''} ` : `${years}y `
    if (months) string += verbose ? `${months} month${months > 1 ? 's' : ''} ` : `${months}mo `
    if (days) string += verbose ? `${days} day${days > 1 ? 's' : ''} ` : `${days}d `
    if (hours) string += verbose ? `${hours} hour${hours > 1 ? 's' : ''} ` : `${hours}h `
    if (minutes) string += verbose ? `${minutes} minute${minutes > 1 ? 's' : ''} ` : `${minutes}m `
    if (seconds) string += verbose ? `${seconds} second${seconds > 1 ? 's' : ''} ` : `${seconds}s `
    if (milliseconds) string += verbose ? `${milliseconds} millisecond${milliseconds > 1 ? 's' : ''} ` : `${milliseconds}ms `

    return string
}