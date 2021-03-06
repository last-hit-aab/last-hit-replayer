import { CoverageEntry } from 'puppeteer';
import { FlowParameters } from 'last-hit-types';

export type IncludingFilter = { story: string; flow?: string };
export type IncludingFilters = IncludingFilter[];
// for push replay summary to admin server
export const ConfigForAdminKeys = [ 'adminUrl', 'adminToken', 'adminWorkspaceId', 'adminTestPlanId' ];
export type ConfigForAdmin = {
	adminUrl?: string;
	adminToken?: string;
	adminWorkspaceId?: string | number;
	adminTestPlanId?: string | number;
}
export const ConfigForRuntimeKey = [ 'urlReplaceRegexp', 'urlReplaceTo', 'sleepAfterChange', 'slowAjaxTime' ];
export type ConfigForRuntime = {
	urlReplaceRegexp?: string;
	urlReplaceTo?: string;
	sleepAfterChange?: number;
	slowAjaxTime?: number;
}
export type Config = ConfigForAdmin & ConfigForRuntime & {
	[key in string]: any;
} & {
	/** environment name */
	env: string;
	/** workspace folder */
	workspace: string;
	/** including */
	includes?: IncludingFilters;
	parallel?: number;
	/** is in child process */
	child?: boolean;
};
export type WorkspaceConfig = {
	envs: { [key in string]: any };
};
export type EnvironmentOptions = {
	name: string;
	workspace: string;
	urlReplaceRegexp?: string;
	urlReplaceTo?: string;
	sleepAfterChange?: number;
	slowAjaxTime?: number;
	includes?: IncludingFilters;
	parallel?: number;
	child?: boolean;
	// for push replay summary to admin server
	adminUrl?: string;
	adminToken?: string;
	adminWorkspaceId?: string | number;
	adminTestPlanId?: string | number;
};
export type FlowFile = { story: string; flow: string };

export type SlowAjax = { url: string; time: number; };
export type Summary = {
	numberOfFailed: number;
	storyName: string;
	flowName: string;
	numberOfStep: number;
	numberOfUIBehavior: number;
	numberOfSuccess: number;
	numberOfAjax: number;
	numberOfAssert: number;
	slowAjaxRequest?: Array<SlowAjax>;
	ignoreErrorList?: [];
	errorStack: String;
	screenCompareList?: Array<{
		stepIndex: number;
		stepUuid: string;
		target: string;
		path: string;
		csspath: string;
		custompath?: string;
		datapath?: string;
		human: string;
		type: string;
	}>;
	testLogs?: Array<{ title: string; passed: boolean; level?: number }>;
	flowParams: FlowParameters;
	/** flow is jammed, because of dependency failed */
	jammed?: boolean;
};

export type Report = Summary & {
	/** format: "abc: 8748.3349609375ms" */
	spent: string;
};
export type CoverageEntryRange = { start: number; end: number };
export type Coverages = CoverageEntry[];
export type FlowResult = {
	report: Report;
	coverages: Coverages;
	code: 'success' | 'pending';
};
