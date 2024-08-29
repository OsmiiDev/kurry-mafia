/* eslint-disable */
import type { BaseTranslation } from '../i18n-types'

const en = {
	GUARDS: {
		DISABLED_COMMAND: 'This command is currently disabled.',
		MAINTENANCE: 'This bot is currently in maintenance mode.',
		GUILD_ONLY: 'This command can only be used in a server.',
		NSFW: 'This command can only be used in a NSFW channel.',
		COOLDOWN: 'This command is on cooldown for `{time:string}`.',
	},
	ERRORS: {
		UNKNOWN: 'An unknown error occurred.',
		NO_PERMISSION: 'You are lacking a required permission ({permission:string}) to perform this action.',
	},
	SHARED: {
		NO_COMMAND_DESCRIPTION: 'No description provided.',
	},
	MODULES: {

	},
	COMMANDS: {
		INFO: {
			DESCRIPTION: 'Get some information about the bot.',
			EMBED: {
				TITLE: ":wave: Hi, I'm Kurry!",
			},
		},
		FLAG: {
			DESCRIPTION: 'Command used to get the flag. Admins only :)',
		},
		PREFIX: {
			NAME: 'prefix',
			DESCRIPTION: 'Change the prefix of the bot.',
			OPTIONS: {
				PREFIX: {
					NAME: 'new_prefix',
					DESCRIPTION: 'The new prefix of the bot.',
				},
			},
			EMBED: {
				DESCRIPTION: 'Prefix changed to `{prefix:string}`.',
			},
		},
		MAINTENANCE: {
			DESCRIPTION: 'Set the maintenance mode of the bot.',
			EMBED: {
				DESCRIPTION: 'Maintenance mode set to `{state:string}`.',
			},
		},
		STATS: {
			DESCRIPTION: 'Get some stats about the bot.',
			HEADERS: {
				COMMANDS: 'Commands',
				GUILDS: 'Guild',
				ACTIVE_USERS: 'Active Users',
				USERS: 'Users',
			},
		},
		HELP: {
			DESCRIPTION: 'Help with commands or general support.',
			EMBED: {
				TITLE: 'Command help',
				DESCRIPTION: 'For more information on the commands in a specific category, use the dropdown menu below.',
				FIELD_TITLE: 'Support',
				FIELD_DESCRIPTION: '<#1170571813139517592>',
				CATEGORY_TITLE: '{category:string} Commands',
				NO_PERMISSION: '<:Warn:1087961063468834816> You do not have permission to run one or more of these commands.',
			},
			SELECT_MENU: {
				TITLE: 'Select a category',
				CATEGORY_DESCRIPTION: '{category:string} commands',
			},
		},
		PING: {
			DESCRIPTION: 'Pong!',
			MESSAGE: 'Pong! **Message round-trip took** `{time:number}ms`**.**',
		},
		SLOWMODE: {
			DESCRIPTION: 'Set slowmode for a channel.',
			REASON: 'Slowmode set by /slowmode',
			EMBED: {
				TITLE: 'Set Slowmode Result',
				DESCRIPTION: 'Slowmode in provided channels was set to `{time:string}` for `{length:string}`.',
				TASK_SUCCESS_MULTIPLE: 'Set slowmode for {channels:number} channels',
				TASK_SUCCESS_SINGLE: 'Set slowmode for <#{channel_id:string}>',
				TASK_FAILED_MULTIPLE: 'Failed to set slowmode for {channels:number} channels',
				TASK_FAILED_SINGLE: 'Failed to set slowmode for <#{channel_id:string}>',
			},
		},
		WARN: {
			DESCRIPTION: 'Warn a user.',
			REASON: 'No reason provided',
			EMBED: {
				TITLE: 'Warn Result',
				DESCRIPTION: '**Warned {user:string} ||** {reason:string}.',
				TASK_SUCCESS_CREATE: 'Successfully created warn for user',
				TASK_FAILED_CREATE: 'Failed to create warn for user',
				TASK_SUCCESS_DM: 'Successfully sent DM to user',
				TASK_FAILED_DM: 'Could not DM user (are their DMs closed?)',
			},
		},
	},
} satisfies BaseTranslation

export default en
