# React 라이브러리에 테스트, CI/CD, 자동 배포 구축하기 (완벽 가이드)

## 🎯 들어가며

npm 패키지를 만들어 배포했지만, 테스트 코드도 없고 매번 수동으로 배포하는 것이 번거로웠습니다. 그래서 이번에 제대로 된 개발 환경을 구축해보기로 했습니다.

이 글에서는 다음 내용을 다룹니다:
- ✅ Vitest + React Testing Library로 테스트 환경 구축
- ✅ 99.2% 코드 커버리지 달성
- ✅ GitHub Actions를 이용한 CI/CD 파이프라인 구축
- ✅ Codecov 연동으로 커버리지 추적
- ✅ Git 태그 기반 npm 자동 배포
- ✅ 실제로 마주친 문제들과 해결 과정

**프로젝트:** [circular-queue-react](https://github.com/km-kwon/react-circular-queue)
- TypeScript 기반 원형 큐/버퍼 라이브러리
- React 훅 제공

## 📦 프로젝트 개요

### 기존 상태
- ❌ 테스트 코드 없음
- ❌ 수동 배포 (npm publish)
- ❌ 코드 커버리지 추적 안 됨
- ❌ CI/CD 파이프라인 없음

### 목표 상태
- ✅ 108개 테스트 케이스 작성
- ✅ 99.2% 코드 커버리지 달성
- ✅ GitHub Actions로 자동 테스트
- ✅ Git 태그 푸시 시 자동 npm 배포
- ✅ Codecov로 커버리지 추적

---

## 1단계: 테스트 환경 구축

### 1.1 필요한 패키지 설치

처음에는 Vitest 최신 버전(4.x)을 설치했지만, 버그가 있어서 안정 버전으로 다운그레이드했습니다.

```bash
npm install -D vitest@2.1.6 \
  @testing-library/react@^16.3.1 \
  @testing-library/jest-dom@^6.9.1 \
  @testing-library/user-event@^14.6.1 \
  @vitejs/plugin-react@^5.1.2 \
  @vitest/coverage-v8@^2.1.6 \
  happy-dom@^20.0.11 \
  react@^19.2.3 \
  react-dom@^19.2.3 \
  typescript@^5.0.0
```

> **주의:** `jsdom` 대신 `happy-dom`을 사용했습니다. GitHub Actions CI 환경에서 jsdom 초기화 오류가 발생했기 때문입니다.

### 1.2 Vitest 설정 파일 생성

**vitest.config.mts** (`.mts` 확장자 사용!)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: "./__test__/setup.ts",
    include: ["__test__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      all: false,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "__test__/",
        "dist/",
        "examples/",
        "coverage/",
        "**/*.config.ts",
        "src/types/**",
        "src/index.ts",
        "src/hooks/index.ts",
      ],
    },
  },
});
```

> **포인트:**
> - `.ts` 아닌 `.mts` 확장자 사용 (Vite CJS 경고 방지)
> - `environment: "happy-dom"` (jsdom 대신)
> - `coverage.exclude`로 불필요한 파일 제외

### 1.3 테스트 셋업 파일 생성

**__test__/setup.ts**

```typescript
import "@testing-library/jest-dom/vitest";
```

### 1.4 package.json 스크립트 추가

```json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 2단계: 테스트 코드 작성

### 2.1 테스트 구조

프로젝트에는 3개의 주요 모듈이 있었습니다:
1. **CircularBuffer** - 저수준 API (방향 기반 버퍼 조작)
2. **BufferManager** - 고수준 API (push/pop/peek 메서드)
3. **useCircularBuffer** - React 훅

각 모듈마다 테스트 파일을 작성했습니다:

```
__test__/
├── setup.ts
├── CircularBuffer.test.ts     (32 tests)
├── BufferManager.test.ts      (47 tests)
└── useCircularBuffer.test.tsx (29 tests)
```

### 2.2 테스트 예시: CircularBuffer

**__test__/CircularBuffer.test.ts**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { CircularBuffer, Direction } from "../src/CircularBuffer";

describe("CircularBuffer", () => {
  let buffer: CircularBuffer<string>;

  beforeEach(() => {
    buffer = new CircularBuffer<string>(3);
    buffer.push("A", Direction.TAIL);
    buffer.push("B", Direction.TAIL);
    buffer.push("C", Direction.TAIL);
  });

  describe("Push operations", () => {
    it("should push to HEAD direction", () => {
      buffer.push("X", Direction.HEAD);
      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD)).toBe("X");
    });

    it("should overwrite oldest when buffer is full", () => {
      buffer.push("D", Direction.TAIL);
      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD)).toBe("B"); // A가 밀려남
    });
  });

  describe("Pop operations", () => {
    it("should pop from HEAD direction", () => {
      const item = buffer.pop(Direction.HEAD);
      expect(item).toBe("A");
      expect(buffer.getSize()).toBe(2);
    });

    it("should reset indices when buffer becomes empty", () => {
      buffer.pop(Direction.HEAD);
      buffer.pop(Direction.HEAD);
      buffer.pop(Direction.HEAD);

      expect(buffer.getSize()).toBe(0);
      buffer.push("X", Direction.TAIL);
      expect(buffer.get(Direction.HEAD)).toBe("X");
    });
  });

  describe("Edge cases", () => {
    it("should throw error for invalid direction", () => {
      expect(() => buffer.get("invalid" as Direction)).toThrow(
        "Invalid direction"
      );
    });

    it("should return undefined when getting from empty buffer", () => {
      buffer.clear();
      expect(buffer.get(Direction.HEAD)).toBeUndefined();
    });
  });
});
```

### 2.3 React 훅 테스트 예시

**__test__/useCircularBuffer.test.tsx**

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCircularBuffer } from "../src/hooks/useCircularBuffer";

describe("useCircularBuffer", () => {
  it("should initialize with correct capacity", () => {
    const { result } = renderHook(() => useCircularBuffer<number>(5));
    expect(result.current.capacity).toBe(5);
    expect(result.current.size).toBe(0);
  });

  it("should push and retrieve items", () => {
    const { result } = renderHook(() => useCircularBuffer<string>(3));

    act(() => {
      result.current.push("A");
      result.current.push("B");
    });

    expect(result.current.size).toBe(2);
    expect(result.current.peekHead()).toBe("A");
  });

  it("should trigger re-render on state change", () => {
    const { result } = renderHook(() => useCircularBuffer<number>(3));

    const initialSize = result.current.size;

    act(() => {
      result.current.push(1);
    });

    expect(result.current.size).not.toBe(initialSize);
  });
});
```

### 2.4 테스트 실행 및 커버리지 확인

```bash
npm test
# ✓ 108 tests passed

npm run test:coverage
# Coverage: 99.2%
# - CircularBuffer: 100%
# - BufferManager: 100%
# - useCircularBuffer: 97.5%
```

**결과:**
- **108개 테스트 케이스** 모두 통과
- **99.2% 코드 커버리지** 달성
- Uncovered lines는 에러 핸들링의 극히 일부 경로만 해당

---

## 3단계: GitHub Actions CI/CD 구축

### 3.1 CI 워크플로우 생성

**.github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches:
      - master
      - main
  pull_request:
    branches:
      - master
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  coverage:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false
        env:
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

**포인트:**
- **Multi-version 테스트:** Node.js 18, 20, 22에서 모두 테스트
- **별도 coverage job:** Codecov 업로드를 위한 독립된 작업
- **npm ci 사용:** package-lock.json 기반 정확한 의존성 설치

### 3.2 npm 자동 배포 워크플로우 생성

**.github/workflows/publish.yml**

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**핵심 메커니즘:**
1. `v*` 형식의 Git 태그가 푸시되면 자동 실행
2. 테스트와 빌드를 먼저 수행
3. 성공하면 npm에 배포
4. `--provenance` 플래그로 소스 검증 가능

---

## 4단계: Codecov 연동

### 4.1 codecov.yml 생성

```yaml
coverage:
  status:
    project:
      default:
        target: auto
        threshold: 1%
    patch:
      default:
        target: auto
        threshold: 1%

comment:
  layout: "header, diff, flags, components, footer"
  behavior: default
  require_changes: false
```

### 4.2 Codecov 토큰 발급 및 설정

1. https://codecov.io 접속
2. GitHub 계정으로 로그인
3. 저장소 추가 (Add repository)
4. Upload token 복사

**GitHub Secrets에 추가:**
- Repository Settings > Secrets and variables > Actions
- Name: `CODECOV_TOKEN`
- Value: 복사한 토큰

---

## 5단계: npm 토큰 설정

### 5.1 npm Granular Access Token 발급

> ⚠️ **주의:** npm Classic Token은 2024년부터 중단되었습니다!

1. https://www.npmjs.com/settings/[username]/tokens 접속
2. "Generate New Token" > "Granular Access Token" 선택
3. 설정:
   - Expiration: 1년
   - Permissions: **Read and write**
   - Packages: All packages 또는 특정 패키지 선택
4. 토큰 복사

### 5.2 GitHub Secrets에 NPM_TOKEN 추가

- Repository Settings > Secrets and variables > Actions
- Name: `NPM_TOKEN`
- Value: 발급받은 토큰

---

## 6단계: CHANGELOG 및 README 업데이트

### 6.1 CHANGELOG.md 생성

**CHANGELOG.md**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-12-24

### Added
- Integrated GitHub Actions CI/CD workflows
  - Automated testing on push and pull requests
  - Multi-version Node.js testing (18, 20, 22)
  - Automated npm publishing on version tags
- Comprehensive test suite with Vitest and React Testing Library
  - 108 test cases covering all functionality
  - 99.2% code coverage
  - Tests for CircularBuffer, BufferManager, and useCircularBuffer hook
- Codecov integration for coverage reporting
- Status badges in README (npm version, license, CI status, coverage)

### Changed
- Updated development dependencies for testing infrastructure
- Improved CI/CD pipeline with automated quality checks

## [1.0.1] - 2025-12-23

### Changed
- Added GitHub repository URL to package.json
- Added homepage and bug tracker links
- Improved npm package metadata

## [1.0.0] - 2025-12-22

### Added
- Initial release
- CircularBuffer low-level API for direction-based circular buffer operations
- BufferManager high-level API with convenient push/pop/peek methods
- React hook: `useCircularBuffer` for stateful React integration
- Full TypeScript support with generics
- Zero dependencies (React as optional peer dependency)
- O(1) push/pop/peek operations
- Support for React 16.8+, 17, 18, 19
```

### 6.2 README에 뱃지 추가

```markdown
# circular-queue-react

[![npm version](https://img.shields.io/npm/v/circular-queue-react.svg)](https://www.npmjs.com/package/circular-queue-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/km-kwon/react-circular-queue/actions/workflows/ci.yml/badge.svg)](https://github.com/km-kwon/react-circular-queue/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/km-kwon/react-circular-queue/branch/master/graph/badge.svg)](https://codecov.io/gh/km-kwon/react-circular-queue)
```

---

## 7단계: 배포 프로세스

### 7.1 버전 업데이트 및 태그 배포

```bash
# 1. CHANGELOG.md 업데이트
# 2. package.json 버전 업데이트 (1.0.1 -> 1.0.2)

# 3. 커밋 및 푸시
git add .
git commit -m "chore: integrate GitHub Actions and implement comprehensive test suite (v1.0.2)"
git push origin master

# 4. 태그 생성 및 푸시 (자동 배포 트리거!)
git tag v1.0.2
git push origin v1.0.2
```

### 7.2 자동 배포 확인

1. GitHub Actions 확인: https://github.com/km-kwon/react-circular-queue/actions
2. "Publish to npm" 워크플로우 실행 확인
3. npm 배포 확인:
   ```bash
   npm view circular-queue-react version
   # 1.0.2
   ```

---

## 🐛 트러블슈팅: 마주친 문제들과 해결

### 문제 1: Vitest 4.0.16 "No test suite found" 버그

**증상:**
```
Error: No test suite found
```

**원인:** Vitest 4.x 버전의 버그

**해결:**
```bash
npm install -D vitest@2.1.6
```

---

### 문제 2: Vite CJS 빌드 경고

**증상:**
```
The CJS build of Vite's Node API is deprecated
```

**원인:** `.ts` 확장자를 사용하면 CommonJS로 인식

**해결:**
```bash
# vitest.config.ts → vitest.config.mts로 변경
mv vitest.config.ts vitest.config.mts
```

---

### 문제 3: jsdom 초기화 오류 (GitHub Actions CI)

**증상:**
```
TypeError: Cannot read properties of undefined (reading 'get')
at node_modules/jsdom/lib/jsdom/living/helpers/webidl-conversions.js
```

**시도 1 (실패):**
```typescript
// vitest.config.mts
test: {
  pool: "forks", // 효과 없음
}
```

**최종 해결:**
```bash
# jsdom 제거하고 happy-dom 사용
npm uninstall jsdom
npm install -D happy-dom@^20.0.11
```

```typescript
// vitest.config.mts
test: {
  environment: "happy-dom", // jsdom → happy-dom
}
```

**결과:** CI 에러 완전히 해결! ✅

---

### 문제 4: npm Repository URL 정규화 경고

**증상:**
```
npm warn prepublishOnly Normalizing repository.url
```

**원인:** URL 형식이 잘못됨

**해결:**
```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/km-kwon/react-circular-queue.git"
    // 👆 git+ 접두사 추가!
  }
}
```

---

### 문제 5: npm 배포 실패 - ENEEDAUTH

**증상:**
```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in
```

**원인:** NPM_TOKEN이 GitHub Secrets에 설정 안 됨

**해결:**
1. npm Granular Access Token 발급 (Classic Token은 중단됨!)
2. GitHub Secrets에 `NPM_TOKEN` 추가
3. 태그 재생성:
   ```bash
   git tag -d v1.0.2
   git push origin :refs/tags/v1.0.2
   git tag v1.0.2
   git push origin v1.0.2
   ```

---

### 문제 6: 뱃지가 업데이트 안 됨

**증상:** npm 버전은 1.0.2인데 뱃지는 1.0.1로 표시

**원인:** 뱃지 캐시

**해결:**
- 5~10분 대기 (자동 업데이트됨)
- 또는 브라우저 강제 새로고침 (Ctrl + F5)

---

## 📊 최종 결과

### 테스트 커버리지

```
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   99.26 |    98.21 |     100 |   99.26 |
 CircularBuffer.ts          |     100 |      100 |     100 |     100 |
 BufferManager.ts           |     100 |      100 |     100 |     100 |
 useCircularBuffer.tsx      |   97.56 |    93.75 |     100 |   97.56 |
----------------------------|---------|----------|---------|---------|
```

### CI/CD 파이프라인

✅ **자동 테스트**
- Node.js 18, 20, 22에서 자동 테스트
- Pull Request마다 자동 실행
- 테스트 실패 시 머지 차단 가능

✅ **자동 배포**
- Git 태그 푸시 → 자동 테스트 → 자동 빌드 → npm 배포
- 수동 작업 최소화

✅ **코드 품질 추적**
- Codecov로 커버리지 추적
- PR마다 커버리지 변화 확인
- 뱃지로 한눈에 상태 확인

### 개발 워크플로우 개선

**이전:**
```bash
# 1. 테스트 수동 실행
npm test

# 2. 수동 빌드
npm run build

# 3. npm 로그인
npm login

# 4. 수동 배포
npm publish

# 5. Git 태그 수동 생성
git tag v1.0.2
git push --tags
```

**이후:**
```bash
# 1. 버전 업데이트 (CHANGELOG + package.json)
# 2. 커밋
git commit -m "chore: bump version to 1.0.2"
git push

# 3. 태그 푸시 (이게 끝!)
git tag v1.0.2
git push origin v1.0.2

# → 자동으로 테스트, 빌드, 배포 완료! 🎉
```

---

## 🎓 배운 점

### 1. 테스트는 선택이 아닌 필수

테스트 코드를 작성하면서:
- **버그를 조기에 발견**할 수 있었습니다
- **리팩토링 시 안정감**이 생겼습니다
- **문서화 역할**도 수행합니다 (테스트가 곧 사용 예시)

### 2. CI/CD는 생산성을 크게 높인다

수동 배포는:
- 실수하기 쉽고
- 시간이 오래 걸리고
- 일관성이 떨어집니다

자동화 후:
- **실수 제로**
- **배포 시간 90% 단축**
- **일관된 프로세스**

### 3. 문서화는 미래의 나를 위한 투자

CHANGELOG와 README를 꼼꼼히 작성하니:
- 버전별 변경사항을 한눈에 파악
- 사용자가 쉽게 이해
- 유지보수가 편해짐

### 4. 오픈소스 도구의 힘

- Vitest: 빠르고 현대적인 테스트 도구
- GitHub Actions: 무료 CI/CD
- Codecov: 무료 커버리지 추적
- npm: 배포 플랫폼

모두 무료로 제공되는 도구들입니다!

---

## 📚 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Codecov 문서](https://docs.codecov.com/)
- [npm Publishing 가이드](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/)

---

## 🚀 다음 단계

앞으로 추가하고 싶은 것들:
- [ ] E2E 테스트 추가 (Playwright)
- [ ] 성능 벤치마크 자동화
- [ ] Storybook으로 컴포넌트 문서화
- [ ] 자동 릴리스 노트 생성
- [ ] Renovate로 의존성 자동 업데이트

---

## 마무리

처음에는 "테스트 추가하고 CI/CD 구축하는 게 그렇게 어려울까?" 싶었지만, 실제로 해보니 생각보다 많은 시행착오가 있었습니다.

특히 jsdom 오류, npm 토큰 문제 등 예상치 못한 이슈들을 만났지만, 하나씩 해결하면서 많이 배웠습니다.

이제는 **코드 푸시 → 자동 테스트 → 태그 푸시 → 자동 배포**라는 완벽한 자동화 파이프라인이 구축되었습니다.

여러분도 이 가이드를 참고해서 프로젝트에 테스트와 CI/CD를 도입해보세요!

---

**프로젝트 링크:**
- 📦 [npm 패키지](https://www.npmjs.com/package/circular-queue-react)
- 💻 [GitHub 저장소](https://github.com/km-kwon/react-circular-queue)
- 📊 [Codecov](https://codecov.io/gh/km-kwon/react-circular-queue)

**질문이나 피드백은 댓글로 남겨주세요!** 🙌
