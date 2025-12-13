/**
 * Cloudflare Workers-compatible timeout wrapper
 * Uses Promise.race for reliable timeout handling
 */
export class TimeoutError extends Error {
	constructor(
		message: string,
		public readonly timeoutMs: number,
	) {
		super(message);
		this.name = 'TimeoutError';
	}
}

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Optional custom error message
 * @returns The result of the promise if it completes before timeout
 * @throws TimeoutError if the promise exceeds the timeout
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	errorMessage?: string,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(
				new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`, timeoutMs),
			);
		}, timeoutMs);
	});

	try {
		const result = await Promise.race([promise, timeoutPromise]);
		return result;
	} finally {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
	}
}
