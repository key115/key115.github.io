# Web Assets — TypeBack

> `web/typeback/` 配下の静的素材（画像・スタイル）の管理ルール。

最終更新: 2026-05-13

---

## 1. ディレクトリ構成

```
web/typeback/
├── index.html               LP（日英並記）
├── privacy.html             プライバシーポリシー（日英並記）
├── support.html             サポートページ（日英並記）
└── assets/
    ├── README.md            このファイル
    ├── images/
    │   ├── typeback-hero.jpg LP ヒーロー画像（生成済み）
    │   ├── og.png           1200×630 OGP 画像（提出前に追加）
    │   ├── favicon.png      512×512 favicon ベース
    │   ├── favicon.ico      32×32 (Web 用)
    │   └── apple-touch-icon.png  180×180
    └── style.css            （未配置・必要なら HTML から style 切り出し）
```

---

## 2. 配置ルール

### 2.1 画像
- すべて `assets/images/` 配下に配置
- ファイル名は小文字スネークケース or kebab-case
- フォーマット: PNG（透過不要なら JPG/WebP も可）
- `typeback-hero.jpg` は LP 用の生成画像。外部参照せず、`index.html` から相対パスで読み込む
- favicon / OGP は `output/Resources/Images/TypeBackIcon_WoodRetro.png`（採用済みアイコン）から派生

### 2.2 スタイル
- 現状は各 HTML ファイル内に `<style>` インライン
- 共通化が必要になったら `assets/style.css` に切り出し、各 HTML から `<link>` で参照
- 外部 CDN（fonts.googleapis.com 等）は **使用しない**（プライバシー・オフライン公開維持のため）

### 2.3 アイコン生成（提出前）
```bash
# AppIcon の 1024×1024 を OGP / favicon に流用
SRC="../../output/Resources/Images/TypeBackIcon_WoodRetro.png"

# OGP 画像（1200×630）— 中央配置 + 背景塗りは画像編集ツールで作成
# favicon
sips -z 512 512 "$SRC" --out images/favicon.png
sips -z 180 180 "$SRC" --out images/apple-touch-icon.png
# .ico は別途変換（ImageMagick or オンライン変換）
```

---

## 3. 各 HTML の依存関係

| ファイル | 依存リソース |
|---------|-------------|
| `index.html` | `./assets/images/typeback-hero.jpg`, `./privacy.html`, `./support.html` リンク |
| `privacy.html` | `./index.html`, `./support.html` リンク |
| `support.html` | `./index.html`, `./privacy.html` リンク |

外部 CDN・外部スクリプト一切なし（オフライン完結）。

---

## 4. デプロイ手順（GitHub Pages 推奨）

```bash
# リポジトリのルートで実行（例）
cd /path/to/your/repo
mkdir -p docs/  # GitHub Pages の standard publishing source
cp -r web/typeback/* docs/

# settings → Pages → Source: main branch / docs folder
# URL 例: https://username.github.io/repo-name/
```

または別ブランチ（gh-pages）で:
```bash
git checkout --orphan gh-pages
git rm -rf .
cp -r web/typeback/* .
git add .
git commit -m "Initial gh-pages"
git push origin gh-pages
```

> 注: デプロイ自体はこのタスクの範囲外。`docs/release_checklist.md` の人間作業項目に含めること。

---

## 5. 公開時のチェックリスト

- [ ] HTTPS で配信されている（GitHub Pages はデフォルト HTTPS）
- [ ] 外部 analytics スクリプト（GA, GTM 等）が **含まれていない**
- [ ] 外部フォント CDN が **含まれていない**（system-ui で十分）
- [ ] OGP 画像（`og.png`）配置済
- [ ] favicon（`favicon.ico`, `apple-touch-icon.png`）配置済
- [ ] 各 HTML の `<a href="#">` プレースホルダー（App Store URL, Email 等）を実 URL に置換済
- [ ] 言語切替アンカー（`#ja` / `#en`）が動作する
- [ ] モバイル表示で崩れない（`<meta viewport>` 設定済）
- [ ] `privacy.html` URL を App Store Connect の "Privacy Policy URL" に登録
- [ ] `support.html` URL を App Store Connect の "Support URL" に登録
- [ ] `index.html` URL を App Store Connect の "Marketing URL" に登録（任意）

---

## 6. 関連
- `docs/app_store_metadata_final.md` §7 — URL 登録欄
- `docs/landing_page_draft.md` — LP の元 Markdown
- `docs/privacy_policy_draft.md` — Privacy の元 Markdown
- `docs/support_page_draft.md` — Support の元 Markdown
- `docs/release_checklist.md` — リリース前タスク
