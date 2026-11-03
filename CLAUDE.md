# 별의 정령 — 작업 규칙

도트 그래픽 우주 턴제 로그라이크. 1인 개발 + AI.

## 기준 문서
- 기획의 기준은 위키: https://claude.ai/artifact/4DLkJhJA5DNNAUkvVTj7Ke
- 규칙이 바뀌면 위키를 먼저 고치고 코드에 반영한다.

## 기술
- TypeScript + Phaser 3 (3.90) + Vite. 테스트는 Vitest.
- 게임 해상도 320×180, `pixelArt: true`, 화면에 맞춰 확대.

## 구조
- `src/core/` 게임 규칙(육각 좌표, 턴 순서, 원소, 피해 계산). **Phaser를 import하지 않는 순수 TypeScript**로 두고 `tests/`에 테스트를 붙인다.
- `src/scenes/` Phaser 장면. 그리기와 입력만 담당하고 규칙은 `core`를 부른다.
- 육각은 flat-top, odd-q 오프셋 좌표(홀수 열이 반 칸 아래).

## 확인 방법
- 커밋 전: `npm run typecheck && npm test`
- 화면 확인: `npm run shot` → `screenshots/`에 판, 드래그 중, 이동 후 스크린샷 저장 (페이지 오류가 있으면 실패)

## 작업 방식
- 한 번에 작은 기능 하나, 기능 단위로 PR.
- 그림은 손맛이 확인될 때까지 임시 도형.
- 대화는 한국어로.
