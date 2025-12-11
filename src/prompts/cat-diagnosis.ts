import type { CatInfo } from '../types/cat';

export function buildCatDiagnosisPrompt(cat: CatInfo): string {
	const healthConcernsText =
		cat.healthConcerns.hasIssues && cat.healthConcerns.concerns
			? cat.healthConcerns.concerns.join('、')
			: '特になし';

	const dislikedFoodText =
		cat.dislikedFood.status === 'ある' && cat.dislikedFood.details
			? `ある（${cat.dislikedFood.details.join('、')}）`
			: cat.dislikedFood.status;

	return `あなたは経験豊富な獣医師アシスタントです。以下の猫の情報に基づいて、健康アドバイスを提供してください。

## 猫の情報

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
- **健康上のお悩み**: ${healthConcernsText}

## 回答形式

以下の項目について、やさしく分かりやすい日本語でアドバイスをお願いします：

1. **総合評価**: ${cat.name}ちゃんの現在の健康状態の概要
2. **食事のアドバイス**: 体型、活動量、好みを考慮した食事の提案
3. **体重管理**: 現在の体重と体型に基づくアドバイス
4. **健康上の注意点**: 報告されたお悩みに対する具体的なケアのヒント
5. **生活習慣のヒント**: 活動量を考慮した日常のケアについて
6. **獣医師への相談推奨事項**: 専門家に相談すべき点があれば

**注意**: このアドバイスは一般的な情報提供を目的としており、専門的な獣医学的診断に代わるものではありません。具体的な健康問題については、必ず獣医師にご相談ください。`;
}
