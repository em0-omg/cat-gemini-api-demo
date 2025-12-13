export interface RetryOptions {
	/** Maximum number of attempts (default: 3) */
	maxAttempts: number;
	/** Initial delay in milliseconds (default: 1000) */
	initialDelayMs: number;
	/** Maximum delay in milliseconds (default: 10000) */
	maxDelayMs: number;
	/** Backoff multiplier (default: 2) */
	backoffMultiplier: number;
	/** Custom function to determine if error is retryable */
	shouldRetry?: (error: unknown) => boolean;
}

export class RetryError extends Error {
	constructor(
		message: string,
		public readonly attempts: number,
		public readonly lastError: unknown,
	) {
		super(message);
		this.name = 'RetryError';
	}
}

/**
 * Default retry condition: Retry on network errors and rate limits
 */
function defaultShouldRetry(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Retry on rate limits
		if (message.includes('rate limit') || message.includes('429') || message.includes('quota')) {
			return true;
		}

		// Retry on network/connection errors
		if (
			message.includes('network') ||
			message.includes('timeout') ||
			message.includes('connection') ||
			message.includes('econnrefused') ||
			message.includes('enotfound') ||
			message.includes('fetch failed')
		) {
			return true;
		}

		// Retry on 5xx server errors (but not 4xx client errors)
		if (
			message.includes('500') ||
			message.includes('502') ||
			message.includes('503') ||
			message.includes('504')
		) {
			return true;
		}
	}

	return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with retry logic and exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws RetryError if all attempts fail, or the original error if not retryable
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: Partial<RetryOptions> = {},
): Promise<T> {
	const {
		maxAttempts = 3,
		initialDelayMs = 1000,
		maxDelayMs = 10000,
		backoffMultiplier = 2,
		shouldRetry = defaultShouldRetry,
	} = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Don't retry if this is the last attempt
			if (attempt === maxAttempts) {
				break;
			}

			// Check if we should retry this error
			if (!shouldRetry(error)) {
				throw error; // Fail fast for non-retryable errors
			}

			// Calculate delay with exponential backoff
			const delayMs = Math.min(initialDelayMs * backoffMultiplier ** (attempt - 1), maxDelayMs);

			console.log(
				`[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms:`,
				error instanceof Error ? error.message : String(error),
			);

			// Wait before retrying
			await sleep(delayMs);
		}
	}

	// All retries exhausted
	throw new RetryError(`Operation failed after ${maxAttempts} attempts`, maxAttempts, lastError);
}
