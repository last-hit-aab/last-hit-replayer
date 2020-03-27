import fs from 'fs';
import jsonfile from 'jsonfile';
import path from 'path';
import { argv as args } from 'yargs';
import { Config, ConfigForAdminKeys, ConfigForRuntimeKey, EnvironmentOptions, WorkspaceConfig } from '../types';
import { getProcessId } from '../utils';
import Environment from './env';

const processId = getProcessId();

const assertWorkspace = async (): Promise<string> => {
	const workspace = args.workspace as string | null;
	if (!workspace) {
		// workspace must be appointed
		console.error(
			(`Process[${processId}] Please specify workspace folder via [--workspace=folder].`
				.bold as any).red
		);
		return Promise.reject();
	}
	return workspace;
};

const readConfigFile = (workspace: string): Config => {
	let config: Config;

	const configFile = args['config-file'] as string | null;
	delete args['config-file'];
	if (configFile) {
		config = jsonfile.readFileSync(
			path.isAbsolute(configFile) ? configFile : path.join(workspace, configFile)
		);
	} else {
		config = {} as Config;
	}
	const configJson = args['config-json'] as string | null;
	delete args['config-json'];
	if (configJson) {
		try {
			const json = JSON.parse(configJson);
			config = Object.assign(config, json);
		} catch (e) {
			console.error('failed to parse config json from cli');
		}
	}
	config.workspace = workspace;

	// story or flow is appointed via cli, has highest priority
	const storyName = args.story as string | undefined;
	const flowName = args.flow as string | undefined;
	if (storyName) {
		config.includes = [ { story: storyName, flow: flowName } ];
	}

	// env name are appointed via cli, has highest priority
	const envName = args.env as string | null;
	if (envName) {
		config.env = envName;
	}

	Object.keys(args).filter(name => name.startsWith('settings-')).forEach(name => config[name] = args[name]);
	return config;
};

const readWorkspaceFile = async (workspace: string): Promise<WorkspaceConfig> => {
	const workspaceSettingsFile = fs.readdirSync(workspace).find(name => name.endsWith('.lhw'));
	if (workspaceSettingsFile) {
		return jsonfile.readFileSync(
			path.join(workspace, workspaceSettingsFile)
		) as WorkspaceConfig;
	} else {
		// workspace file not found
		return { envs: [] } as WorkspaceConfig;
	}
};

const buildEnvironment = async (
	config: Config,
	workspaceConfig: WorkspaceConfig
): Promise<Environment> => {
	let env: EnvironmentOptions;

	// find appointed environment
	const envName = config.env;
	if (envName) {
		env = (workspaceConfig.envs || []).find((env: EnvironmentOptions) => env.name === envName);
		if (env == null) {
			console.error(
				(`Process[${processId}] Given environment[${envName}] not found.`.bold as any).red
			);
			return Promise.reject();
		}
	} else {
		env = Environment.exposeNoop();
		ConfigForRuntimeKey.forEach(prop => {
			if (config[prop] != null) {
				env[prop] = config[prop];
			}
		});
	}
	env.workspace = config.workspace;
	env.includes = config.includes;
	env.child = config.child;
	env.parallel = (args.parallel || config.parallel) as number;
	ConfigForAdminKeys.forEach(prop => {
		if (config[prop] != null) {
			env[prop] = config[prop];
		}
	});

	// settings are appointed via cli, has highest priority
	const settings = Object.keys(config)
		.filter(key => key.startsWith('settings-'))
		.reduce((all, key) => {
			all[key.replace('settings-', '')] = config[key];
			return all;
		}, {});
	// mix settings to environment
	env = Object.assign(env, settings);
	return new Environment(env);
};

export const loadConfig = async (): Promise<Environment> => {
	try {
		const workspace = await assertWorkspace();
		const config = readConfigFile(workspace);
		const workspaceConfig = await readWorkspaceFile(workspace);
		return buildEnvironment(config, workspaceConfig);
	} catch (e) {
		return Promise.reject(e);
	}
};
