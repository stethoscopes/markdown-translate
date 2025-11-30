# Git 명령어 치트시트

Git의 주요 명령어들을 정리한 문서입니다.

## 기본 설정

```bash
# 사용자 이름 설정
git config --global user.name "Your Name"

# 이메일 설정
git config --global user.email "your.email@example.com"

# 설정 확인
git config --list
```

## 저장소 관리

### 저장소 생성

```bash
# 새 저장소 초기화
git init

# 원격 저장소 복제
git clone <url>
```

### 기본 워크플로우

```bash
# 변경사항 확인
git status

# 파일 스테이징
git add <file>
git add .  # 모든 변경사항

# 커밋
git commit -m "커밋 메시지"

# 원격 저장소에 푸시
git push origin main
```

## 브랜치 관리

| 명령어 | 설명 |
|--------|------|
| `git branch` | 브랜치 목록 확인 |
| `git branch <name>` | 새 브랜치 생성 |
| `git checkout <name>` | 브랜치 전환 |
| `git checkout -b <name>` | 브랜치 생성 및 전환 |
| `git merge <branch>` | 브랜치 병합 |
| `git branch -d <name>` | 브랜치 삭제 |

## 변경사항 관리

```bash
# 변경사항 임시 저장
git stash

# 임시 저장 목록 확인
git stash list

# 임시 저장 복원
git stash pop
```

## 히스토리 확인

```bash
# 커밋 로그 확인
git log

# 간단한 로그
git log --oneline

# 그래프로 보기
git log --graph --oneline --all
```

## 원격 저장소

```bash
# 원격 저장소 확인
git remote -v

# 원격 저장소 추가
git remote add origin <url>

# 원격 변경사항 가져오기
git fetch

# 가져오기 및 병합
git pull
```

## 유용한 팁

> ⚠️ **주의**: `git push --force`는 신중하게 사용하세요!

### .gitignore

특정 파일이나 폴더를 Git에서 제외하려면 `.gitignore` 파일을 사용하세요:

```
node_modules/
.env
*.log
dist/
```

### 커밋 메시지 작성 가이드

좋은 커밋 메시지:
- ✅ `feat: 사용자 로그인 기능 추가`
- ✅ `fix: 버튼 클릭 이벤트 오류 수정`
- ✅ `docs: README 업데이트`

나쁜 커밋 메시지:
- ❌ `update`
- ❌ `fix bug`
- ❌ `asdfasdf`

---

**참고**: 이 문서는 기본적인 Git 명령어만 다룹니다. 더 자세한 내용은 [공식 문서](https://git-scm.com/doc)를 참조하세요.
