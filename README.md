# 🗺️ 함바여지도 - 독립형 순수 웹 애플리케이션 (Standalone Web Version)

안드로이드 의존성 없이 **오직 웹 브라우저만으로 100% 작동**하는 독립형 '함바여지도' 서비스입니다.

---

## 📁 프로젝트 파일 구성

- **`index.html`**: 메인 HTML 구조, 카카오 지도 JS SDK 연동 및 모달 시스템
- **`style.css`**: 시그니처 오렌지 테마(`#F15A24`), Pretendard 폰트, 반응형 디자인 및 애니메이션
- **`app.js`**: 지도 탐색, GPS 내 위치 찾기, `LocalStorage` 기반 식당/리뷰/즐겨찾기 상태 관리
- **`package.json`**: 간단한 로컬 웹 서버 구동 스크립트

---

## 🚀 실행 방법

### 방법 1. 브라우저로 직접 열기 (가장 간편함)
1. `C:\AndroidAppProject\hamba-web\index.html` 파일에 마우스 우클릭 ➔ **열기** ➔ **Chrome / Edge / Whale** 등 웹 브라우저 선택
2. 별도의 설치 없이 바로 지도 탐색 및 웹 서비스를 이용할 수 있습니다.

### 방법 2. npm으로 로컬 서버 실행하기
1. 터미널(PowerShell)에서 해당 디렉토리로 이동:
   ```bash
   cd C:\AndroidAppProject\hamba-web
   ```
2. 웹 서버 구동:
   ```bash
   npm start
   ```
3. 안내되는 주소(예: `http://localhost:3000`)로 접속하여 사용합니다.
