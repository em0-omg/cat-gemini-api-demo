import { DEFAULT_CAT_DIAGNOSIS_PROMPT } from '../prompts/cat-diagnosis';
import { type CatDiagnosisPromptData, PROMPT_PATHS } from '../types/prompt';

/**
 * R2からプロンプトデータを取得するサービス
 */
export class PromptService {
	constructor(private bucket: R2Bucket | null) {}

	/**
	 * 猫診断用プロンプトデータを取得
	 * R2から取得できない場合はフォールバックデータを返す
	 */
	async getCatDiagnosisPrompt(): Promise<CatDiagnosisPromptData> {
		if (!this.bucket) {
			console.warn('[PromptService] R2 bucket not available, using fallback');
			return DEFAULT_CAT_DIAGNOSIS_PROMPT;
		}

		try {
			const object = await this.bucket.get(PROMPT_PATHS.CAT_DIAGNOSIS);

			if (!object) {
				console.warn(
					`[PromptService] Prompt file not found: ${PROMPT_PATHS.CAT_DIAGNOSIS}, using fallback`,
				);
				return DEFAULT_CAT_DIAGNOSIS_PROMPT;
			}

			const text = await object.text();
			const data = JSON.parse(text) as CatDiagnosisPromptData;

			console.log(
				`[PromptService] Loaded prompt from R2 (version: ${data.version}, updated: ${data.updatedAt})`,
			);

			return data;
		} catch (error) {
			console.error('[PromptService] Failed to load prompt from R2:', error);
			console.warn('[PromptService] Using fallback prompt data');
			return DEFAULT_CAT_DIAGNOSIS_PROMPT;
		}
	}
}
