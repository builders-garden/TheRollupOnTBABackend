// Duration of the poll
export interface Duration {
	label: string;
	value: string;
	seconds: number;
}

// Guest of the poll that will receive percentage of the payout
export interface Guest {
	owner: boolean;
	nameOrAddress: string;
	splitPercent: string;
}
