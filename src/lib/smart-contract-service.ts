/** biome-ignore-all lint/complexity/noStaticOnlyClass: <frank needs static methods> */

/**
 * Backend smart contract service for game finalization
 */
export class BackendSmartContractService {
	/**
	 * Hello world
	 * Sample function
	 */
	static async helloWorld(): Promise<{
		success: boolean;
		message?: string;
		error?: string;
	}> {
		try {
			return {
				success: true,
				message: "Hello world",
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}
