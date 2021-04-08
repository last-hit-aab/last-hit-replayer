import fs from 'fs';
import jsonfile from 'jsonfile';
import path from 'path';
import Environment from '../config/env';
import { Coverages, FlowFile, Report, SlowAjax } from '../types';
import { getLogger, getProcessId } from '../utils';
import { print } from './print';
import { handleFlow } from './single-flow';

const processId = getProcessId();

const createTemporaryFolders = async (
	env: Environment
): Promise<{
	resultTempFolder: string;
	threadTempFolder: string;
}> => {
	const workspace = env.getWorkspace();
	const resultTempFolder = path.join(workspace, '.result-temp');
	if (!env.isOnChildProcess()) {
		// not in child process, delete the result temp folder
		if (fs.existsSync(resultTempFolder)) {
			fs.rmdirSync(resultTempFolder, { recursive: true });
		}
	}
	if (!fs.existsSync(resultTempFolder)) {
		fs.mkdirSync(resultTempFolder);
	}
	const threadTempFolder = path.join(resultTempFolder, processId);
	if (!fs.existsSync(threadTempFolder)) {
		fs.mkdirSync(threadTempFolder);
	}

	const resultParamsTempFolder = path.join(workspace, '.result-params-temp');
	if (!env.isOnChildProcess()) {
		// not in child process, delete the result temp folder
		if (fs.existsSync(resultParamsTempFolder)) {
			fs.rmdirSync(resultParamsTempFolder, { recursive: true });
		}
	}
	if (!fs.existsSync(resultParamsTempFolder)) {
		fs.mkdirSync(resultParamsTempFolder);
	}

	return {
		resultTempFolder,
		threadTempFolder
	};
};

export const doOnSingleProcess = async (flows: FlowFile[], env: Environment): Promise<void> => {
	const { threadTempFolder } = await createTemporaryFolders(env);
	let jammed = false;

	const logger = getLogger();
	const reports: Report[] = [];
	const allCoverages: Coverages = [];
	try {
		const pendingFlows: Array<FlowFile> = flows;
		const run = async (flows: Array<FlowFile>) => {
			await flows.reduce(async (promise, flow) => {
				await promise;
				try {
					const { report, coverages, code } = await handleFlow(flow, env);
					if (code === 'pending') {
						pendingFlows.push(flow);
					} else {
						reports.push(report);
						if (coverages && Array.isArray(coverages)) {
							allCoverages.push(...coverages);
						}
					}
				} catch (e) {
					logger.error(e);
				}
				return Promise.resolve();
			}, Promise.resolve());
		};
		let countLeft = pendingFlows.length;
		while (pendingFlows.length !== 0) {
			const flows = [ ...pendingFlows ];
			pendingFlows.length = 0;
			await run(flows);
			if (countLeft === pendingFlows.length) {
				// nothing can be run
				jammed = true;
				reports.push(...pendingFlows.map(flowFile => {
					const flowContent = env.readFlowFile(flowFile.story, flowFile.flow);
					return {
						storyName: flowFile.story,
						flowName: flowFile.flow,
						numberOfStep: (flowContent.steps || []).length,
						numberOfUIBehavior: 0,
						numberOfSuccess: 0,
						numberOfAjax: 0,
						numberOfAssert: 0,
						numberOfFailed: 0,
						errorStack: '',
						flowParams: (flowContent.params || []).filter(param => param.type === 'both' || param.type === 'in'),
						jammed: true,
						spent: `${flowFile.flow}@${flowFile.story}: 0ms\n`
					} as Report;
				}));
				break;
			} else {
				countLeft = pendingFlows.length;
			}
		}
	} catch {
		// ignore
	}

	const isChildProcess = env.isOnChildProcess();

	jsonfile.writeFileSync(path.join(threadTempFolder, 'summary.json'), reports);
	jsonfile.writeFileSync(path.join(threadTempFolder, 'coverages.json'), allCoverages);

	// print when not child process
	!isChildProcess && await print(env);
	console.info((`Process[${processId}] finished`.bold as any).green);

	if (jammed && isChildProcess) {
		return Promise.reject('jammed');
	}
};
