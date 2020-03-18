import fs from 'fs';
import { Flow, Story } from 'last-hit-types';
import path from 'path';
import Environment from '../config/env';
import { FlowFile } from '../types';

export const inElectron = !!process.versions.electron;

export const getTempFolder = (fallbackFolder?: string): string | undefined => {
	if (inElectron) {
		// IMPORTANT donot move to import block, electron might not exists
		const { app } = require('electron');
		return app.getPath('logs');
	} else {
		return fallbackFolder;
	}
};

/**
 * get process id
 */
export const getProcessId = (): string => `${process.pid}`;

/**
 * rewrite log files, note only be called in CI
 */
let logger: Console;
export const getLogger = (): Console => {
	if (!logger) {
		const output = fs.createWriteStream(path.join(process.cwd(), 'stdout.log'));
		const errorOutput = fs.createWriteStream(path.join(process.cwd(), 'stderr.log'));
		logger = new console.Console({ stdout: output, stderr: errorOutput });
	}
	return logger;
};

export const shorternUrl = (url: string): string => {
	try {
		const parsed = new URL(url);
		parsed.search = '';
		parsed.hash = '';
		return parsed.href;
	} catch {
		// parse fail, not a valid url, return directly
		return url;
	}
};

/**
 * generate flow key
 */
export const generateKeyByObject = (story: Story, flow: Flow): string =>
	`[${flow.name}@${story.name}]`;
export const generateKeyByString = (storyName: string, flowName: string): string =>
	`[${flowName}@${storyName}]`;

/**
 * build flows array of given workspace
 */
export const findFlows = (env: Environment): FlowFile[] => {
	const workspace = env.getWorkspace();
	const flows = fs
		.readdirSync(workspace)
		.filter(dir => fs.statSync(path.join(workspace, dir)).isDirectory())
		.filter(dir => ![ '.scripts' ].includes(dir))
		.map(storyName => {
			return fs
				.readdirSync(path.join(workspace, storyName))
				.filter(flowFilename =>
					fs.statSync(path.join(workspace, storyName, flowFilename)).isFile()
				)
				.filter(flowFilename => flowFilename.endsWith('.flow.json'))
				.map(flowFilename => flowFilename.replace(/^(.*)\.flow\.json$/, '$1'))
				.filter(
					flowName =>
						env.isIncluded(storyName, flowName) && !env.isExcluded(storyName, flowName)
				)
				.map(flowName => ({ story: storyName, flow: flowName }));
		})
		.reduce((flows, array) => {
			flows.push(...array);
			return flows;
		}, [] as FlowFile[]);
	const flowMap: { [key in string]: FlowFile } = {};
	const necessaryFlows = flows.map(flowFile => {
		flowMap[generateKeyByString(flowFile.story, flowFile.flow)] = flowFile;
		return flowFile;
	}).reduce((necessary, flowFile) => {
		const {
			settings: { forceDepends, dataDepends = [] } = {
				forceDepends: undefined,
				dataDepends: undefined
			}
		} = env.readFlowFile(flowFile.story, flowFile.flow);
		if (forceDepends) {
			const { story, flow } = forceDepends;
			const key = generateKeyByString(story, flow);
			if (!flowMap[key]) {
				// not include, includes it
				const add = { story, flow };
				necessary.push(add);
				flowMap[key] = add;
			}
		}
		dataDepends.forEach(({ story, flow }) => {
			const key = generateKeyByString(story, flow);
			if (!flowMap[key]) {
				// not include, includes it
				const add = { story, flow };
				necessary.push(add);
				flowMap[key] = add;
			}
		});
		return necessary;
	}, [] as FlowFile[]);
	return [ ...necessaryFlows, ...flows ];
};

const defaultName = 'last-hit';
let starts: { [key in string]: number } = {};
export const startTime = (name: string = defaultName) => {
	starts[name] = new Date().getTime();
};

export const endTime = (name: string = defaultName) => {
	const now = new Date().getTime();
	const start = starts[name];
	if (start) {
		delete starts[name];
		return now - start;
	} else {
		return 0;
	}
};