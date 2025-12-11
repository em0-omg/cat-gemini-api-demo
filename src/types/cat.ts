/**
 * 体型 (Body Type)
 */
export type BodyType = '痩せすぎ' | 'ちょい痩せ' | '普通' | 'ちょいおデブ' | 'おデブちゃん';

/**
 * 活動量 (Activity Level)
 */
export type ActivityLevel = 'ずっと寝てる' | '普通' | 'よく飛ぶ';

/**
 * 主食 (Main Food)
 */
export type MainFood = 'ドライフード' | 'ウェットフード' | 'その他';

/**
 * おやつ頻度 (Treats Frequency)
 */
export type TreatsFrequency = 'ときどき' | '毎日' | '全くあげない';

/**
 * 好きな食べ物 (Favorite Food)
 */
export type FavoriteFood = 'チキン' | 'ビーフ' | 'お魚' | 'なんでも好き';

/**
 * 苦手なお肉やお魚の状態 (Disliked Food Status)
 */
export type DislikedFoodStatus = 'ない' | 'わからない' | 'ある';

/**
 * 健康上のお悩み選択肢 (Health Concern Options)
 */
export type HealthConcernOption =
	| '食べ過ぎ'
	| '少食'
	| '偏食・食べムラ'
	| '食物アレルギー'
	| 'その他のお悩み'
	| '肥満'
	| '吐き戻し'
	| '下部尿路疾患'
	| '痩身'
	| '歯'
	| '腎臓疾患'
	| '嘔吐'
	| '便秘'
	| '涙やけ'
	| '肝臓疾患'
	| '下痢'
	| '関節'
	| '糖尿'
	| '皮膚';

/**
 * 苦手な食材の詳細 (Specific Disliked Foods)
 */
export type DislikedFoodDetail = '鶏肉' | 'サーモン' | '牛肉' | 'マグロ' | 'カツオ' | 'たら';

/**
 * 苦手なお肉やお魚 (Disliked Food)
 */
export interface DislikedFood {
	status: DislikedFoodStatus;
	details?: DislikedFoodDetail[];
}

/**
 * 健康上のお悩み (Health Concerns)
 */
export interface HealthConcerns {
	hasIssues: boolean;
	concerns?: HealthConcernOption[];
}

/**
 * 性別 (Gender)
 */
export type Gender = 'オス' | 'メス';

/**
 * 猫の情報 (Cat Information)
 */
export interface CatInfo {
	name: string;
	gender: Gender;
	neutered: boolean;
	age: number;
	breed: string;
	bodyType: BodyType;
	weight: number;
	activityLevel: ActivityLevel;
	mainFood: MainFood;
	treats: TreatsFrequency;
	favoriteFood: FavoriteFood;
	dislikedFood: DislikedFood;
	healthConcerns: HealthConcerns;
}

/**
 * 診断リクエスト (Diagnosis Request)
 */
export interface DiagnosisRequest {
	cat: CatInfo;
}

/**
 * 診断レスポンス (Diagnosis Response)
 */
export interface DiagnosisResponse {
	diagnosis: string;
	generatedAt: string;
}

// 提案商品の型
export interface RecommendedProduct {
	name: string; // 商品名
	category: string; // カテゴリ（主食/おやつ/ケアフード）
	series: string; // シリーズ名
	reason: string; // この猫に推奨する理由
	features: string[]; // 商品の特徴（2-3項目）
}

// Gemini APIからの構造化レスポンス（generatedAt以外）
export interface RecommendationResult {
	summary: string; // 診断サマリ（この猫の特徴と食事のポイント）
	recommendations: RecommendedProduct[]; // 推奨商品リスト（最大3つ）
	notes: string; // 注意事項・免責
}

// APIレスポンス型
export interface RecommendationResponse extends RecommendationResult {
	generatedAt: string; // 生成日時
}

/**
 * エラーレスポンス (Error Response)
 */
export interface ErrorResponse {
	error: string;
	message: string;
}
