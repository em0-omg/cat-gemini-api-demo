/**
 * R2に保存するプロンプトデータの型定義
 */
export interface CatDiagnosisPromptData {
	/** プロンプトデータのバージョン */
	version: string;
	/** 最終更新日時 (ISO 8601形式) */
	updatedAt: string;
	/** uniam商品カタログ (Markdown形式) */
	catalog: string;
	/** システムプロンプトの導入部分 */
	systemPrompt: string;
	/** 商品選定基準 */
	selectionCriteria: string;
	/** 回答ガイドライン */
	responseGuidelines: string;
}

/** R2のプロンプトファイルパス */
export const PROMPT_PATHS = {
	CAT_DIAGNOSIS: 'prompts/cat-diagnosis.json',
} as const;
