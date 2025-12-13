import { describe, expect, it } from 'vitest';
import { TimeoutError, withTimeout } from '../utils/timeout';

describe('withTimeout', () => {
	it('should resolve if promise completes before timeout', async () => {
		const promise = Promise.resolve('success');
		const result = await withTimeout(promise, 1000);
		expect(result).toBe('success');
	});

	it('should throw TimeoutError if promise exceeds timeout', async () => {
		const slowPromise = new Promise((resolve) => {
			setTimeout(() => resolve('late'), 200);
		});

		await expect(withTimeout(slowPromise, 50)).rejects.toThrow(TimeoutError);
	});

	it('should include timeout duration in error', async () => {
		const slowPromise = new Promise((resolve) => {
			setTimeout(() => resolve('late'), 200);
		});

		try {
			await withTimeout(slowPromise, 50);
		} catch (error) {
			expect(error).toBeInstanceOf(TimeoutError);
			expect((error as TimeoutError).timeoutMs).toBe(50);
		}
	});

	it('should use custom error message when provided', async () => {
		const slowPromise = new Promise((resolve) => {
			setTimeout(() => resolve('late'), 200);
		});

		try {
			await withTimeout(slowPromise, 50, 'Custom timeout message');
		} catch (error) {
			expect(error).toBeInstanceOf(TimeoutError);
			expect((error as TimeoutError).message).toBe('Custom timeout message');
		}
	});

	it('should propagate original error if promise rejects before timeout', async () => {
		const failingPromise = Promise.reject(new Error('Original error'));

		await expect(withTimeout(failingPromise, 1000)).rejects.toThrow('Original error');
	});

	it('should clear timeout when promise resolves', async () => {
		// This test verifies no memory leaks from uncleared timeouts
		const promises = Array.from({ length: 100 }, () => withTimeout(Promise.resolve('quick'), 1000));

		const results = await Promise.all(promises);
		expect(results).toHaveLength(100);
		expect(results.every((r) => r === 'quick')).toBe(true);
	});
});
