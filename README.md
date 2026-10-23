# ROOM LAB · 가구 배치 시뮬레이터

HTML / CSS / JavaScript로 만든 정적 웹앱입니다. 빌드, npm 설치, API 키, 서버가 필요하지 않습니다.

## 파일 구성
- index.html: 화면 구성과 CSS
- app.js: 3D/평면 렌더링, 가구 배치, 치수 편집, 저장 기능
- floorplan.jpg: 참고용 원본 평면도 (모델은 좌우 반전형)
- .nojekyll: GitHub Pages 정적 파일 제공 설정

## GitHub Pages 배포
1. 새 GitHub 저장소를 만듭니다. 무료 개인 계정이라면 Public 저장소를 사용합니다.
2. ZIP을 압축 해제하고 **안에 있는 파일**을 저장소 최상위에 올려 커밋합니다. ZIP 파일 자체를 올리는 방식이 아닙니다.
3. 저장소의 Settings → Pages로 이동합니다.
4. Build and deployment의 Source에서 Deploy from a branch를 선택합니다.
5. Branch는 main, Folder는 /(root)로 선택하고 Save를 누릅니다.
6. 배포가 완료되면 Pages 설정에 나타나는 사이트 주소를 엽니다.

기존 저장소의 기본 브랜치가 main이 아니라면 해당 브랜치를 선택합니다.
공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 로컬 실행
같은 폴더 안에 index.html, app.js, floorplan.jpg를 두고 index.html을 브라우저로 엽니다.
파일 주소에서 자동 저장이 제한되는 브라우저도 있으므로 배치 저장(JSON 다운로드)을 사용하세요.
또는 Python 설치 환경에서 해당 폴더에 `python -m http.server 8000`을 실행하고 http://localhost:8000 을 엽니다.

## 사용
- 3D 공간: 드래그 회전, 휠 또는 +/- 확대
- 평면 배치: 가구 드래그 이동
- 가구 상세: 가로·깊이·높이(mm), 중심 X/Y, 회전(90도 단위) 설정
- 배치 저장: JSON 다운로드 / 불러오기
- 자동 저장은 같은 브라우저·사이트 주소 안에서만 유지됩니다. 기존 호스팅에서 저장한 배치는 JSON으로 내보내 GitHub Pages에서 불러오세요.

## 모델 기준
도면 외곽 폭 5,470mm, 세로 기준 8,385mm. 도면의 3,210mm 및 4,790mm 구간을 맞추고 나머지는 비례 추출했습니다. 좌우 반전형입니다.
천장 높이 기본 2,400mm와 주방·수납 깊이 기본 600mm는 추정값이며 앱에서 수정할 수 있습니다.
도면의 다른 세로 표기 8,418mm와의 33mm 차이는 미확정입니다.
정밀 실측 모델이 아니며 창호·문 개방 범위·고정 시설 세부 치수는 미확정입니다. 구매·설치 전 실측하세요.

## 공개 범위
GitHub Pages로 배포하면 방 구조와 포함된 원본 평면도를 방문자가 볼 수 있습니다. 이 패키지에는 로그인·접근 제한 기능이 없습니다.
