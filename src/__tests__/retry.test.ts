import { describe, expect, it, vi } from 'vitest';
import { RetryError, withRetry } from '../utils/retry';

describe('withRetry', () => {
	it('should succeed on first attempt', async () => {
		const fn = vi.fn().mockResolvedValue('success');
		const result = await withRetry(fn);

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should retry on retryable errors (network)', async () => {
		let attempts = 0;
		const fn = vi.fn().mockImplementation(() => {
			attempts++;
			if (attempts < 3) {
				return Promise.reject(new Error('Network error'));
			}
			return Promise.resolve('success');
		});

		const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('should retry on rate limit errors', async () => {
		let attempts = 0;
		const fn = vi.fn().mockImplementation(() => {
			attempts++;
			if (attempts < 2) {
				return Promise.reject(new Error('Rate limit exceeded (429)'));
			}
			return Promise.resolve('success');
		});

		const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('should retry on timeout errors', async () => {
		let attempts = 0;
		const fn = vi.fn().mockImplementation(() => {
			attempts++;
			if (attempts < 2) {
				return Promise.reject(new Error('timeout'));
			}
			return Promise.resolve('success');
		});

		const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 });

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('should throw RetryError after max attempts', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('Persistent network error'));

		await expect(withRetry(fn, { maxAttempts: 2, initialDelayMs: 10 })).rejects.toThrow(RetryError);

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('should not retry on non-retryable errors (400 Bad Request)', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('400 Bad Request'));

		await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })).rejects.toThrow(
			'400 Bad Request',
		);

		// Should fail immediately without retry
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should not retry on auth errors', async () => {
		const fn = vi.fn().mockRejectedValue(new Error('Invalid API key'));

		// This is a non-network error, won't be retried by default
		await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })).rejects.toThrow(
			'Invalid API key',
		);

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('should use exponential backoff', async () => {
		const delays: number[] = [];
		let lastTime = Date.now();
		let attempts = 0;

		const fn = vi.fn().mockImplementation(() => {
			const now = Date.now();
			if (attempts > 0) {
				delays.push(now - lastTime);
			}
			lastTime = now;
			attempts++;
			if (attempts < 3) {
				return Promise.reject(new Error('Network error'));
			}
			return Promise.resolve('success');
		});

		await withRetry(fn, {
			maxAttempts: 3,
			initialDelayMs: 50,
			backoffMultiplier: 2,
		});

		// First delay should be ~50ms, second should be ~100ms
		expect(delays[0]).toBeGreaterThanOrEqual(40);
		expect(delays[0]).toBeLessThan(150);
		expect(delays[1]).toBeGreaterThanOrEqual(90);
		expect(delays[1]).toBeLessThan(200);
	});

	it('should respect maxDelayMs', async () => {
		const delays: number[] = [];
		let lastTime = Date.now();
		let attempts = 0;

		const fn = vi.fn().mockImplementation(() => {
			const now = Date.now();
			if (attempts > 0) {
				delays.push(now - lastTime);
			}
			lastTime = now;
			attempts++;
			if (attempts < 4) {
				return Promise.reject(new Error('Network error'));
			}
			return Promise.resolve('success');
		});

		await withRetry(fn, {
			maxAttempts: 4,
			initialDelayMs: 50,
			backoffMultiplier: 10,
			maxDelayMs: 100,
		});

		// All delays should be capped at ~100ms
		for (const delay of delays) {
			expect(delay).toBeLessThan(200); // Allow some tolerance
		}
	});

	it('should use custom shouldRetry function', async () => {
		let attempts = 0;
		const fn = vi.fn().mockImplementation(() => {
			attempts++;
			if (attempts < 3) {
				return Promise.reject(new Error('CustomRetryableError'));
			}
			return Promise.resolve('success');
		});

		const result = await withRetry(fn, {
			maxAttempts: 3,
			initialDelayMs: 10,
			shouldRetry: (error) =>
				error instanceof Error && error.message.includes('CustomRetryableError'),
		});

		expect(result).toBe('success');
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('should include last error in RetryError', async () => {
		// Use a retryable error (network error) to ensure retry logic runs
		const originalError = new Error('Persistent network failure');
		const fn = vi.fn().mockRejectedValue(originalError);

		try {
			await withRetry(fn, { maxAttempts: 2, initialDelayMs: 10 });
		} catch (error) {
			expect(error).toBeInstanceOf(RetryError);
			expect((error as RetryError).lastError).toBe(originalError);
			expect((error as RetryError).attempts).toBe(2);
		}
	});
});
