import { RetryError } from './retry';
import { TimeoutError } from './timeout';

export interface ErrorLogContext {
	requestId: string;
	operation: string;
	timestamp: string;
	durationMs?: number;
}

export interface GeminiErrorDetails {
	errorType: string;
	errorMessage: string;
	isRetryable: boolean;
	statusCode?: number;
}

/**
 * Classifies and logs Gemini API errors with structured output
 * @param error - The error that occurred
 * @param context - Context information for logging
 * @returns Classified error details
 */
export function logGeminiError(error: unknown, context: ErrorLogContext): GeminiErrorDetails {
	// Default error details
	const errorDetails: GeminiErrorDetails = {
		errorType: 'UnknownError',
		errorMessage: 'An unknown error occurred',
		isRetryable: false,
	};

	// Handle RetryError (all retries exhausted)
	if (error instanceof RetryError) {
		const lastError = error.lastError;
		const innerDetails = classifyError(lastError);
		errorDetails.errorType = innerDetails.errorType;
		errorDetails.errorMessage = `${error.message}. Last error: ${innerDetails.errorMessage}`;
		errorDetails.isRetryable = false; // Already exhausted retries
		errorDetails.statusCode = innerDetails.statusCode;
	} else {
		const classified = classifyError(error);
		Object.assign(errorDetails, classified);
	}

	// Log structured error for Cloudflare observability
	console.error(
		JSON.stringify({
			level: 'error',
			timestamp: context.timestamp,
			requestId: context.requestId,
			operation: context.operation,
			durationMs: context.durationMs,
			error: errorDetails,
		}),
	);

	return errorDetails;
}

/**
 * Classifies an error into a specific type
 */
function classifyError(error: unknown): GeminiErrorDetails {
	const details: GeminiErrorDetails = {
		errorType: 'UnknownError',
		errorMessage: 'An unknown error occurred',
		isRetryable: false,
	};

	if (error instanceof TimeoutError) {
		details.errorType = 'TimeoutError';
		details.errorMessage = error.message;
		details.isRetryable = true;
		details.statusCode = 504;
		return details;
	}

	if (error instanceof Error) {
		details.errorMessage = error.message;
		const message = error.message.toLowerCase();

		// Rate limit / Quota errors
		if (message.includes('rate limit') || message.includes('429') || message.includes('quota')) {
			details.errorType = 'RateLimitError';
			details.isRetryable = true;
			details.statusCode = 429;
			return details;
		}

		// Authentication errors
		if (
			message.includes('api key') ||
			message.includes('401') ||
			message.includes('403') ||
			message.includes('unauthorized') ||
			message.includes('forbidden')
		) {
			details.errorType = 'AuthenticationError';
			details.isRetryable = false;
			details.statusCode = 401;
			return details;
		}

		// Network errors
		if (
			message.includes('network') ||
			message.includes('connection') ||
			message.includes('econnrefused') ||
			message.includes('enotfound') ||
			message.includes('fetch failed')
		) {
			details.errorType = 'NetworkError';
			details.isRetryable = true;
			details.statusCode = 503;
			return details;
		}

		// Validation errors
		if (message.includes('400') || message.includes('invalid') || message.includes('bad request')) {
			details.errorType = 'ValidationError';
			details.isRetryable = false;
			details.statusCode = 400;
			return details;
		}

		// Server errors (5xx)
		if (
			message.includes('500') ||
			message.includes('502') ||
			message.includes('503') ||
			message.includes('504')
		) {
			details.errorType = 'ServerError';
			details.isRetryable = true;
			details.statusCode = 503;
			return details;
		}

		// Empty response error
		if (message.includes('empty response')) {
			details.errorType = 'EmptyResponseError';
			details.isRetryable = true;
			details.statusCode = 503;
			return details;
		}

		// JSON parse error
		if (message.includes('json') || message.includes('parse')) {
			details.errorType = 'ParseError';
			details.isRetryable = false;
			details.statusCode = 500;
			return details;
		}

		// Default for Error instances
		details.errorType = 'ServiceError';
		details.statusCode = 503;
	}

	return details;
}
