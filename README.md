# 📝 Markdown Viewer

로컬 경로에 있는 마크다운(.md) 파일을 브라우저에서 보여주는 React 기반 뷰어입니다.

## 🚀 시작하기

### 설치

```bash
npm install
```

### 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 열면 앱이 실행됩니다.

## 📖 사용 방법

1. **파일 선택 버튼 사용**
   - 우측 상단의 "파일 선택" 버튼을 클릭
   - 하나 또는 여러 개의 .md 파일을 선택

2. **드래그 앤 드롭**
   - 마크다운 파일을 브라우저 창으로 드래그하여 놓기

3. **파일 목록에서 선택**
   - 여러 파일을 선택한 경우, 좌측 사이드바의 파일 목록에서 파일을 클릭하여 전환

## ✨ 기능

- ✅ 마크다운 렌더링
- ✅ GitHub Flavored Markdown (GFM) 지원
- ✅ 코드 신택스 하이라이팅
- ✅ 여러 파일 동시 로드
- ✅ 드래그 앤 드롭 지원
- ✅ 다크 테마 UI (GitHub 스타일)
- ✅ 반응형 레이아웃

## 🛠️ 기술 스택

- React 18
- Vite
- react-markdown
- remark-gfm (GitHub Flavored Markdown)
- rehype-highlight (코드 하이라이팅)
- highlight.js

## 📝 지원하는 마크다운 요소

- 제목 (h1-h6)
- 목록 (순서 있음/없음)
- 코드 블록 (신택스 하이라이팅 포함)
- 인라인 코드
- 링크
- 이미지
- 표
- 인용구
- 가로선
- 굵게, 기울임 등

## 🎨 테마

GitHub Dark 테마를 기반으로 한 다크 모드 UI를 제공합니다.
