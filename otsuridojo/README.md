# おつり道場 公開サイト（ソース正本）

公開先: `https://key115.github.io/otsuridojo/`
規約の正本: [`3_resources/know-how/site-deploy-convention.md`](../../../../3_resources/know-how/site-deploy-convention.md)

**このディレクトリがソース正本**。`key115.github.io` は生成物置き場で、直接編集しない（規約1）。

| 公開パス | ファイル | 役割 | 状態 |
|---|---|---|---|
| `/otsuridojo/` | `index.html` | LP（ASC のマーケティングURL欄に入れる） | **PM が執筆。今は最小プレースホルダ** |
| `/otsuridojo/privacy.html` | `privacy.html` | プライバシーポリシー（ASC のプライバシーポリシーURL欄） | 完成 |
| `/otsuridojo/support.html` | `support.html` | サポート（ASC のサポートURL欄・**必須**） | 完成 |
| `/otsuridojo/assets/` | `assets/` | CSS・JS・画像 | 完成（LP用の素材も同梱） |

## デプロイ（PM／オーナー操作）

1. ソース側コミットが `main` に着地していること（規約2）
2. **公開するのは3ページと `assets/` だけ**。`cp -R output/site/. <dest>` は使わない
   （`README.md` / `tests/` / `tools/` まで公開サイトへ出てしまう。bigleaf と
   zenrabansho-site は3ページ＋assetsのみ・reska は README と scripts が漏れている先例）:

   ```sh
   DEST=/Users/k/key115.github.io/otsuridojo
   SRC="AI秘書/1_projects/PRJ-034_おつり道場/output/site"
   mkdir -p "$DEST/assets"
   cp "$SRC"/index.html "$SRC"/privacy.html "$SRC"/support.html "$DEST/"
   cp "$SRC"/assets/* "$DEST/assets/"
   ```

3. `key115.github.io` で `git status` / `git diff --stat` を見て、意図したファイルだけかを確認（規約6・push は即時全世界公開）
4. push → **公開URLを WebFetch で実測**してから完了宣言（規約4。GitHub Pages は push 後 5〜10 分は旧内容を返すことがある）

公開後に見るのは3つ: `/otsuridojo/`（LP・CTAが「近日公開」で出ているか）・
`/otsuridojo/privacy.html`・`/otsuridojo/support.html`。ASC はサポートURLに
到達できないと審査で止まるので、support.html の実測は必須。

## LP（index.html）を書く人へ

LP は PM 執筆（2026-08-17 スコープ変更）。現在の `index.html` は contract test を
通すための最小プレースホルダで、丸ごと差し替えて構わない。

**CTA のマークアップ規約**（これだけ守れば公開時の差込が1箇所で効く）:

```html
<a class="button" data-appstore href="#" data-appstore-label="App Store でダウンロード">
  <span data-cta-text>近日公開</span>
</a>
```

`href="#"` のまま置くこと。`assets/site.js` の `APP_STORE_URL` に実URLが入ると、
href・`rel="noopener"`・文言が自動で差し替わる。空のあいだは `.is-pending`
（破線の押せない札）になり、クリックも抑止される。公開後にだけ見せたい行には
`data-appstore-wrap hidden` を付けておくと、活性化と同時に現れる。

**筆文字の2種類**（間違えると消える）:

- `titlelogo.png` … 墨で塗った透過 PNG。`<img>` にそのまま置く
- `titlelogo-mask.png` … アルファのみ。ダークで生成りに反転させたいときに
  CSS `mask` + `background-color` で使う（`site.css` の `.brush-title` がその実装）

2枚はアルファ（筆の形）が同じで RGB だけが違うので、**マスクとしてはどちらでも効く**。
危ないのは片方だけ: `-mask.png` を `<img>` で読むと**白い塗り**になって生成り地に溶けて消える。
迷いを残さないため mask には `-mask.png`、`<img>` には無印、と名前で固定してある。

**`site.css` にあるもの**: 色トークン（視覚設計書 §2 の実測値・ライト/ダーク両対応）と、
`.button` `.badge` `.eyebrow` `.section-title` `.fuda`（出題札）`.ladder`（段位）
`.phone`（端末枠）`.gallery` `.cards` `.ledger`（項目表）`.faq` `.contact` などの部品。
使わないクラスが残っていても構わない。

**`data-reveal` のスクロール演出は入っていない**。site.js を CTA 活性化だけの
ミニマル実装にしたので、CSS 側の初期非表示も撤去した。演出を足すなら CSS と JS を
必ず同じコミットで入れること（片方だけだと要素が永久に見えなくなる）。

**contract test が LP に要求するのは4点だけ**: ファイル存在 / `data-appstore` が1つ以上 /
取得を伴う外部リソース参照なし / `Test mode` の文字列なし。
見出し・構成・文言・OGP・canonical には踏み込まない。
その代わり、**次の2つはテストで守られないので自分で守ること**:

- **広告方針の4点**（動画なし／出題中の割り込みなし／バナーは画面下部に常時1つ／
  全画面とネイティブは昇段審査の結果画面にだけ）を `docs/store/app_store_listing.md` §4 と
  一字ずらさない。ここがずれると審査で「表示と実装が違う」を突かれる
- **免責文**「医学的な効能や特定の症状の予防・改善を目的とするものではありません」を入れる
  （脳トレの景表法・4.3 リスク）

差し替え前の全面版 LP（ヒーロー・コア体験・段位ラダー・出稽古・広告方針の台帳・
プライバシー・スクショギャラリー）が git 履歴に残っている。素材として使えるので、要れば:

```sh
git show de53c9fd:"AI秘書/1_projects/PRJ-034_おつり道場/output/site/index.html"
```

## App Store の実URL差込（規約3・7）

CTA は `assets/site.js` の 1 行だけが差込口。

```js
var APP_STORE_URL = "";   // ← ここだけ書き換える
```

空のあいだは全 CTA が「近日公開」の押せない札として出る（死リンクを出さない）。
**iTunes Lookup で `resultCount>=1` を実測したら、同一セッション内で**この 1 行に実URLを入れ、
`tests/site_contract_test.py` → デプロイ → 公開URL実測まで通しきる（規約7・「あとで差し込む」を残さない）。

契約テストは URL が入った時点で `https://apps.apple.com/.../idNNNNN` の形を強制するので、
書き間違えたまま公開する事故はゲートで止まる。

## 機械検査

```sh
python3 output/site/tests/site_contract_test.py     # RESULT: PASS
bash scripts/pre-pr-local-gate.sh                  # otsuridojo_site レーンから同じテストが走る
```

検査の濃さはページで違う（LP は PM 執筆なので縛らない）。

| 対象 | 検査していること |
|---|---|
| `index.html`（LP） | **4点だけ** — 存在 / `data-appstore` が1つ以上 / 取得を伴う外部参照なし / `Test mode` なし。加えて「スイッチが空なのに href に実ストアURLが直書き」＝公開前の死リンクだけ弾く（マークアップの自由は奪わない。不要ならこのブロックは1つ消せる） |
| `assets/site.js` | `APP_STORE_URL` が1箇所だけ・入っていれば `apps.apple.com/.../idN` の形・活性化コードの存在・fetch/XHR なし |
| `assets/site.css` | `@import` / `@font-face` / 外部 `url()` なし・`url()` の参照先が実在・`[hidden]` ガード・`.button.is-pending` |
| `privacy.html` | AdMob 名指し・ATT不使用・IDFA不使用・端末内保存・サーバー送信なし・IAPはAppleが決済・EU/EEA配信なし・制定日・Google公式リンク・**広告方針3点**（バナー常時／全画面とネイティブは審査結果限定／動画なし） |
| `support.html` | ¥300・購入の復元・**機種変更で引き継げない**・データ削除＝アプリ削除・出稽古・中断で広告なし・サブスクでない旨・連絡先が本文に2箇所以上・免責文 |
| 両ドキュメント | `認知症` 不使用・lang / title / description / canonical / 著作権 / 連絡先・**対応OS表記が `output/app/project.yml` の deploymentTarget と一致** |

**LP について意図的に検査していないもの**: 広告方針4点の文言整合と免責文。
PM が LP を書き終えたら、この2つを index にも足して縛り直すことを勧める
（審査で最も刺されやすい箇所であり、`privacy.html` 側だけ守っても LP がずれると意味がない）。

## assets の由来

`assets/` は git 追跡された正本だが、`tools/build_site_assets.py` で再生成できる。
由来はアプリの実資産と実機実撮影のみで、サイト専用に描き起こした画像は無い。

| ファイル | サイズ | 由来 |
|---|---|---|
| `appicon.png` | 512×512 | `output/app/Resources/Assets.xcassets/AppIcon.appiconset/icon_light_1024.png` |
| `titlelogo.png` | 1024×274 | 同 `TitleLogo`（墨で塗った透過 PNG・`<img>` 用） |
| `titlelogo-mask.png` | 1024×274 | 同（**アルファのみ**・CSS `mask` 用） |
| `degeikotitle.png` / `-mask.png` | 451×160 | 同 `DegeikoTitle`（上と同じ2種立て） |
| `seal.png` | 220×220 | 同 `Seal`（朱印） |
| `customer_1..5.png` | 各 37×66 前後 | 同 `Customer1`〜`Customer5`（和装モブ客・**原寸**。縮小するとディテールが潰れる） |
| `washi.jpg` / `washi-dark.jpg` | 400×400 | 同 `Washi`（`washiLight@3x` / `washiDark@3x`） |
| `certificate.jpg` | 520×693 | `output/docs/evidence/s3_certificate_1200x1600.png`（`ImageRenderer` の実出力） |
| `shot_*.jpg` | 各 600×1301 | シミュレータ実撮影（下記・6枚） |
| `og.jpg` | 1200×630 | アイコン＋題字を合成（スクリプトが生成） |

画面写真が JPEG なのは、和紙の繊維ノイズが PNG の最も苦手な絵柄で、
PNG のままだと 1 枚 600KB を超えるため（実測）。assets 全体で 550KB 程度に収めている。

撮影済みの6枚: `shot_title` / `shot_title_dark` / `shot_quiz` / `shot_quiz_dark` /
`shot_result`（昇段合格・認定証共有） / `shot_degeiko`。
**すべて `-otsuriAdsRemoved 1` で撮った広告なしのクリーン画面**で、全数を目視して
広告と "Test mode" が写っていないことを確認済み。

## スクリーンショットの撮り直し

**`-otsuriAdsRemoved 1` を必ず付ける**。テスト広告ユニットのままだと "Test mode" の
焼き込みが写り、その画像は使えない（契約テストが文字列としては拾えないので、目視も必須）。

```sh
UDID=9CB044AB-DE66-4E95-8DE6-D6F57D2EE0A6      # iPhone 15 Pro
BUNDLE=com.otsuridojo.app
cd output/app && xcodegen generate
xcodebuild -project OtsuriDojo.xcodeproj -scheme OtsuriDojo -configuration Debug \
  -destination "id=$UDID" -derivedDataPath "$TMPDIR/otsuridojo-site-dd" build
xcrun simctl install "$UDID" "$TMPDIR/otsuridojo-site-dd/Build/Products/Debug-iphonesimulator/OtsuriDojo.app"

# 1枚ずつ: terminate → appearance → launch → 6秒待つ → screenshot
xcrun simctl launch "$UDID" "$BUNDLE" -otsuriScreen title   -otsuriRank 11 -otsuriAdsRemoved 1
xcrun simctl launch "$UDID" "$BUNDLE" -otsuriScreen quiz    -otsuriRank 5 -otsuriInput 5 -otsuriAdsRemoved 1
xcrun simctl launch "$UDID" "$BUNDLE" -otsuriScreen result  -otsuriRank 5 -otsuriAdsRemoved 1
xcrun simctl launch "$UDID" "$BUNDLE" -otsuriScreen degeiko -otsuriAdsRemoved 1
# dark は xcrun simctl ui "$UDID" appearance dark のあとに quiz を撮る

python3 tools/build_site_assets.py --shots <撮った PNG のディレクトリ>
```

撮影引数の定義は [`output/app/Sources/App/DebugLaunchOptions.swift`](../app/Sources/App/DebugLaunchOptions.swift)。
`result` は起動から描画までに時間がかかり、待ちが短いとホーム画面が写る（実際に1回踏んだ）。
撮ったら必ず画像を開いて、広告と "Test mode" が無いことを目視で確認する。

## 文言の正本

プライバシー・サポートの文言は [`docs/store/app_store_listing.md`](../docs/store/app_store_listing.md) から流用している。
**広告方針の 4 点**（動画なし／出題中の割り込みなし／バナーは画面下部に常時1つ／全画面とネイティブは
昇段審査の結果画面にだけ）は ASC の説明文と一字の齟齬も作らない。ここがずれると審査で
「表示と実装が違う」を突かれる。`privacy.html` 側は契約テストの P2 が固定しているが、
**LP 側は未固定**（上の「LP を書く人へ」参照）。

サポートの記述はアプリ実装から裏を取ってある。とくに:
- 昇段は `correct >= examPassCount`（=「合格ラインに**達すると**」。「超えると」ではない）
- 審査は 5 / 7 / 10 問の3種（`PromotionBand` の bandA〜E）で合格ラインは 3 / 5 / 7 / 8 / 9
- 購入と復元の導線は `TitleView` と `ResultView` の両方（`RemoveAdsRowView`）

用語（稽古・審査・段位・銭聖・出稽古・帳場・中断）の定義は [`CONTEXT.md`](../../CONTEXT.md)。
