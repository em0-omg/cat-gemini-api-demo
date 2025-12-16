import type { CatInfo } from '../types/cat';
import type { CatDiagnosisPromptData } from '../types/prompt';

// JSON Schemaの定義（Gemini API用）
export const recommendationSchema = {
	type: 'object',
	properties: {
		summary: {
			type: 'string',
			description: '猫の特徴と食事のポイントのサマリ',
		},
		recommendations: {
			type: 'array',
			description: '推奨商品リスト（最大3つ）',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string', description: '商品名' },
					category: { type: 'string', description: 'カテゴリ（主食/おやつ/ケアフード）' },
					series: { type: 'string', description: 'シリーズ名' },
					reason: { type: 'string', description: 'この猫に推奨する理由' },
					features: {
						type: 'array',
						items: { type: 'string' },
						description: '商品の特徴（2-3項目）',
					},
				},
				required: ['name', 'category', 'series', 'reason', 'features'],
			},
		},
		notes: {
			type: 'string',
			description: '注意事項・免責',
		},
	},
	required: ['summary', 'recommendations', 'notes'],
};

/**
 * フォールバック用デフォルトプロンプトデータ
 * R2から取得できない場合に使用
 */
export const DEFAULT_CAT_DIAGNOSIS_PROMPT: CatDiagnosisPromptData = {
	version: '1.0.0',
	updatedAt: '2025-12-16T00:00:00.000Z',
	catalog: `## uniam（ユニアム）猫用フード 商品カタログ

獣医師・栄養士監修のねこ専門フードブランド

### 主食（総合栄養食）

#### 1. 冷凍フレッシュフード
AAFCO基準準拠。国産食材を低温調理し瞬間冷凍。

**スムースタイプ（パテ状・なめらか食感）**
- スムースチキン＆サーモン: 鶏もも肉、サーモン、鶏胸肉、鶏レバー、鶏ハツ（80g）
- スムースカツオ＆たら: カツオ、タラ（80g）

**ざく切りタイプ（ゴロゴロ食感）**
- ざく切りチキン＆サーモン: 鶏肉、サーモン（80g）
- ざく切りカツオ＆たら: カツオ、タラ（80g）
- ざく切りビーフ＆まぐろ: 牛肉（挽肉・ハツ・レバー）、まぐろ（80g）

#### 2. WiLD PRO ドライフード
ニュージーランド産食材使用。グレインフリー（穀物不使用）。
- 平飼いチキン＆緑イ貝: NZ産平飼いチキン、緑イ貝、ブルーベリー、キウイフルーツ（1.2kg）
- 特徴: 免疫サポート、スチーム製法で栄養とうまみを凝縮

### おやつ

#### 3. ピュアピューレ（機能性おやつ）
獣医師が開発した健康ケア特化型ピューレ。
- デンタルケア（チキン＆ホタテ）: 口内環境ケア、海藻抽出物アスコフィラン、乳酸菌KT-11（8g×5本/10本）
- リフレッシュケア（まぐろ＆ミルク）: リラックスサポート、ミルクプロテイン（8g×5本/10本）

#### 4. ワイルドスナック（ナチュラルおやつ）
国産自然食材100%。合成添加物無添加。

**フリーズドライ製法**
- 国産 若鶏ささみ フリーズドライ: 高タンパク（12g）
- 国産 鶏レバー フリーズドライ: ビタミン豊富（12g）
- 国産 きびなご フリーズドライ: DHA・カルシウム豊富（7g）

**スモーク製法**
- 国産 スモークチキン: 桜チップで燻製（30g）
- 焼津産 ほぐしかつお: 旨味凝縮（30g）

### ケアフード

#### 5. Care Deli（アニコム共同開発・一般食）
ペット保険シェアNo.1のアニコムと共同開発。健康データに基づく予防型ウェットフード。
- 腸内免疫ケア: 腸内環境・免疫力サポート（シールド乳酸菌M-1、フェカリス菌、ビフィズス菌、フラクトオリゴ糖）
- デンタルケア: 口腔環境の健康維持
- 腎臓ケア: 腎泌尿器の健康サポート（低リン設計、卵白、ダンデライオン、クコの実）
- リフレッシュケア: 心のゆとり・リラックス
- 避妊去勢後ケア: 体重管理・代謝サポート（低カロリー設計）

### 全商品共通の特徴
- 獣医師監修
- ヒューマングレード食材使用
- 合成着色料・香料・保存料 不使用
- 全猫種・全年齢対応
- 国内製造（一部NZ産原料）

### 味・原材料の対応表
**お肉系（チキン）**: スムースチキン＆サーモン、ざく切りチキン＆サーモン、平飼いチキン＆緑イ貝、デンタルケア（ピュアピューレ）、若鶏ささみ、鶏レバー、スモークチキン
**お肉系（ビーフ）**: ざく切りビーフ＆まぐろ
**お魚系**: スムースカツオ＆たら、ざく切りカツオ＆たら、ざく切りビーフ＆まぐろ、リフレッシュケア（まぐろ＆ミルク）、きびなご、ほぐしかつお`,
	systemPrompt:
		'あなたはuniamの猫用フード専門アドバイザーです。\n以下のuniam商品カタログから、猫のプロフィールに最適な商品を最大3つ提案してください。',
	selectionCriteria: `1. **主食（総合栄養食）は必ず1つ含める**
2. 健康上のお悩みがある場合は対応するケアフードを優先的に提案
3. 猫の好みの味（チキン/ビーフ/お魚）を考慮
4. 体型や活動量に適した商品を選ぶ
5. 苦手な食べ物が含まれる商品は避ける`,
	responseGuidelines: `- summaryには、この猫の特徴と食事選びのポイントを2-3文で簡潔にまとめてください
- 各商品の推奨理由は、この猫のプロフィールに基づいた具体的な理由を記載してください
- notesには「この提案は一般的な情報提供を目的としています。具体的な健康上の問題がある場合は、獣医師にご相談ください。」という免責事項を含めてください`,
};

/**
 * 猫のプロフィール情報をフォーマット
 */
function formatCatProfile(cat: CatInfo): string {
	const healthConcernsText =
		cat.healthConcerns.hasIssues && cat.healthConcerns.concerns
			? cat.healthConcerns.concerns.join('、')
			: '特になし';

	const dislikedFoodText =
		cat.dislikedFood.status === 'ある' && cat.dislikedFood.details
			? `ある（${cat.dislikedFood.details.join('、')}）`
			: cat.dislikedFood.status;

	return `## 猫のプロフィール

- **名前**: ${cat.name}
- **性別**: ${cat.gender}
- **去勢・避妊**: ${cat.neutered ? '済み' : '未実施'}
- **年齢**: ${cat.age}歳
- **猫種**: ${cat.breed}
- **体型**: ${cat.bodyType}
- **体重**: ${cat.weight}kg
- **活動量**: ${cat.activityLevel}
- **主食**: ${cat.mainFood}
- **おやつの頻度**: ${cat.treats}
- **好きな食べ物**: ${cat.favoriteFood}
- **苦手な食べ物**: ${dislikedFoodText}
- **健康上のお悩み**: ${healthConcernsText}`;
}

/**
 * プロンプトデータと猫情報から完全なプロンプトを構築
 */
export function buildCatRecommendationPrompt(
	cat: CatInfo,
	promptData: CatDiagnosisPromptData,
): string {
	const catProfile = formatCatProfile(cat);

	return `${promptData.systemPrompt}

${promptData.catalog}

${catProfile}

## 選定基準

${promptData.selectionCriteria}

## 回答について

${promptData.responseGuidelines}`;
}
