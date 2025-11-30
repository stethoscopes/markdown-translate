# React 개발 가이드

React는 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리입니다.

## 주요 개념

### 1. 컴포넌트

React 애플리케이션은 컴포넌트로 구성됩니다.

```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

export default Welcome;
```

### 2. State와 Props

- **Props**: 부모로부터 전달받는 읽기 전용 데이터
- **State**: 컴포넌트 내부에서 관리하는 동적 데이터

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        증가
      </button>
    </div>
  );
}
```

### 3. Hooks

주요 React Hooks:

| Hook | 용도 |
|------|------|
| `useState` | 상태 관리 |
| `useEffect` | 부수 효과 처리 |
| `useContext` | Context 값 접근 |
| `useRef` | DOM 참조 |

## 설치 및 실행

```bash
# Vite로 새 프로젝트 생성
npm create vite@latest my-app -- --template react

# 디렉토리 이동
cd my-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 베스트 프랙티스

1. **컴포넌트를 작게 유지하기**
   - 각 컴포넌트는 하나의 책임만 가져야 합니다
   
2. **Props 검증**
   - PropTypes나 TypeScript를 사용하여 타입 안정성 확보

3. **성능 최적화**
   - `React.memo`, `useMemo`, `useCallback` 활용

> 💡 **팁**: 컴포넌트 이름은 항상 대문자로 시작해야 합니다.

## 추가 리소스

- [공식 문서](https://react.dev)
- [React 튜토리얼](https://react.dev/learn)
- [Create React App](https://create-react-app.dev)
