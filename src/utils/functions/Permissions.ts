import { channel } from 'node:diagnostics_channel'

import { APIInteractionGuildMember, Application, ApplicationCommand, ApplicationCommandPermissions, ApplicationCommandPermissionType, GuildChannel, GuildMember, GuildResolvable, PermissionsBitField } from 'discord.js'
import { Client } from 'discordx'

import { resolveDependency } from './Dependency'

export async function hasCommandPermissionAnywhere(member: GuildMember, command: ApplicationCommand<{ guild: GuildResolvable }>, client: Client) {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true
    if (!member.permissions.has(PermissionsBitField.Flags.UseApplicationCommands)) return false

    const guildPermissions = await client.application!.commands.permissions.fetch({ guild: member.guild!.id })

    console.log(guildPermissions)
    const appPermissions = guildPermissions.get(client.application!.id)
    const commandPermissions = guildPermissions.get(command.id)

    const commandUserRolePermissions = commandPermissions?.filter(permission => permission.type === ApplicationCommandPermissionType.Role || permission.type === ApplicationCommandPermissionType.User)
    const appUserRolePermissions = appPermissions?.filter(permission => permission.type === ApplicationCommandPermissionType.Role || permission.type === ApplicationCommandPermissionType.User)

    const commandUserRolePermission = hasUserRolePermissions(member, commandUserRolePermissions || [])
    if (commandUserRolePermission === -1) return false
    if (commandUserRolePermission === 1) return true
    const appUserRolePermission = hasUserRolePermissions(member, appUserRolePermissions || [])
    if (appUserRolePermission === -1) return false

    if (!command.defaultMemberPermissions) return true

    return member.permissions.has(command.defaultMemberPermissions)
}
export async function hasCommandPermission(member: GuildMember, channel: GuildChannel, command: ApplicationCommand<{ guild: GuildResolvable }>, client: Client) {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true
    if (!channel.permissionsFor(member).has(PermissionsBitField.Flags.UseApplicationCommands)) return false

    const guildPermissions = await client.application!.commands.permissions.fetch({ guild: member.guild!.id })

    console.log(guildPermissions)
    const appPermissions = guildPermissions.get(client.application!.id)
    const commandPermissions = guildPermissions.get(command.id)

    const commandChannelPermissions = commandPermissions?.filter(permission => permission.type === ApplicationCommandPermissionType.Channel)
    const appChannelPermissions = appPermissions?.filter(permission => permission.type === ApplicationCommandPermissionType.Channel)

    const commandUserRolePermissions = commandPermissions?.filter(permission => permission.type === ApplicationCommandPermissionType.Role || permission.type === ApplicationCommandPermissionType.User)
    const appUserRolePermissions = appPermissions?.filter(permission => permission.type === ApplicationCommandPermissionType.Role || permission.type === ApplicationCommandPermissionType.User)

    const commandChannelPermission = hasChannelPermissions(channel, commandChannelPermissions || [])
    if (commandChannelPermission === -1) return false
    const appChannelPermission = commandChannelPermission === 'command-user-role' ? 'command-user-role' : hasChannelPermissions(channel, appChannelPermissions || [], 'allow')
    if (appChannelPermission === -1) return false

    const commandUserRolePermission = hasUserRolePermissions(member, commandUserRolePermissions || [])
    if (commandUserRolePermission === -1) return false
    if (commandUserRolePermission === 1) return true
    const appUserRolePermission = hasUserRolePermissions(member, appUserRolePermissions || [])
    if (appUserRolePermission === -1) return false

    if (!command.defaultMemberPermissions) return true

    return member.permissions.has(command.defaultMemberPermissions)
}

export function hasChannelPermissions(channel: GuildChannel, channelPermissions: ApplicationCommandPermissions[], fallback: 'allow' | 'continue' = 'continue') {
    const channelPermission = channelPermissions.find(permission => permission.id === channel.id)
    if (channelPermission !== undefined) return channelPermission.permission ? 'command-user-role' : -1

    const allChannels = channelPermissions.find(permission => permission.id === channel.guild.id)
    if (allChannels !== undefined) return allChannels.permission ? 'command-user-role' : -1

    return fallback === 'allow' ? 'command-user-role' : 'app-channel'
}
export function hasUserRolePermissions(member: GuildMember, userPermissions: ApplicationCommandPermissions[]) {
    const userPermission = userPermissions.find(permission => permission.id === member.id)
    if (userPermission !== undefined) return userPermission.permission ? 1 : -1

    let hasAllow = 0
    for (const role of member.roles.cache.values()) {
        const rolePermission = userPermissions.find(permission => permission.id === role.id)
        if (rolePermission !== undefined && role.id !== member.guild.roles.everyone.id) hasAllow = 1 ? 1 : rolePermission.permission ? 1 : -1
    }
    if (hasAllow !== 0) return hasAllow === 1 ? 1 : -1

    const allUsers = userPermissions.find(permission => permission.id === member.guild.roles.everyone.id)

    if (allUsers !== undefined) return allUsers.permission ? 1 : -1

    return 0 // defer
}