/* Adds Japanese copy to the frozen, English-first sample page at runtime.
   The shared site.js remains the single owner of language state and storage. */
(function () {
  'use strict';

  if (document.documentElement.dataset.samplesI18n === 'ready') return;
  document.documentElement.dataset.samplesI18n = 'ready';

  function bilingual(element, japaneseHtml) {
    if (!element) return;
    var english = document.createElement('span');
    english.className = 'en';
    while (element.firstChild) english.appendChild(element.firstChild);
    var japanese = document.createElement('span');
    japanese.className = 'ja';
    japanese.innerHTML = japaneseHtml;
    element.appendChild(english);
    element.appendChild(japanese);
  }

  var nav = document.querySelector('.site-nav .wrap');
  if (nav && !nav.querySelector('.lang-btn')) {
    var languageControl = document.createElement('span');
    languageControl.className = 'lang-btn';
    languageControl.setAttribute('role', 'group');
    languageControl.setAttribute('aria-label', 'Language');
    nav.appendChild(languageControl);
  }

  bilingual(document.querySelector('.site-nav .links a[href="index.html"]'), 'ホーム');
  bilingual(document.querySelector('.site-nav .links a[href="support.html"]'), 'サポート');

  var intro = document.querySelector('.sample-intro');
  bilingual(intro && intro.querySelector('.kicker'), '恒久App Review用データ');
  bilingual(intro && intro.querySelector('h1'), 'BigLeaf App Review サンプルファイル');
  bilingual(
    intro && intro.querySelector('.lead'),
    '各ファイルを直接ダウンロードできます。URLとバイト列は凍結され、今後の審査でも同じ内容を提供します。完全性を確認できるようSHA-256値を掲載しています。'
  );
  // 公開前の訂正を最初に表示する。既存の開発時注記・訳文は凍結履歴として残す。
  var releaseStatusNote = document.querySelector('.release-status-note');
  var releaseStatusParagraphs = releaseStatusNote ? releaseStatusNote.querySelectorAll('p') : [];
  [
    '<strong>公開予定のバージョン1.2.0: 以下の「v1.1 以降」は未公開の開発時の呼称です。次回の公開版はバージョン1.2.0です。</strong>',
    'バージョン1.2.0が公開されるまでは、App Storeの公開版は1.0.0で、以下のPreview Mode・購入・Restoreの仕様が引き続き適用されます。バージョン1.2.0では、購入せずにすべてのレコードを閲覧・検索・ジャンプできるようになります。サンプルファイル・URL・バイト列はすべて変更しません。以前の説明は以下にそのまま残しています。'
  ].forEach(function (copy, index) {
    bilingual(releaseStatusParagraphs[index], copy);
  });

  // 版スコープ注記（ADR-0002 追補 2026-08-29）。凍結ページの英語行は書き換えられない
  // ので、訂正は「版スコープを自分で持つ追加ブロック」で行う。JA でも同じ注記が出ないと、
  // 日本語で読む審査官・利用者には 1.0.0 の記述だけが見えることになる。
  // クラスは .version-note — .review-callout にすると下の callouts[0]/[1] の索引がずれる。
  var versionNote = document.querySelector('.version-note');
  var versionNoteParagraphs = versionNote ? versionNote.querySelectorAll('p') : [];
  [
    '<strong>注記（v1.1 以降）: BigLeafは完全無料です。以下で説明しているPreview Mode・購入・Restoreの挙動は、バージョン1.0.0 のみに当てはまります。</strong>',
    'このページのファイル・URL・バイト列は今後の審査のために凍結しており、書き換えることはありません。そのため以下の説明はバージョン1.0.0 当時の文言のままです。v1.1 以降はファイルサイズの制限がなく、下記のどのファイルも全レコードを閲覧・検索・ジャンプできます。そのための購入はアプリのどこにもありません。'
  ].forEach(function (copy, index) {
    bilingual(versionNoteParagraphs[index], copy);
  });

  var callouts = document.querySelectorAll('.review-callout');
  bilingual(callouts[0] && callouts[0].querySelector('h2'), 'Preview Modeと購入を最短で試す');
  bilingual(
    callouts[0] && callouts[0].querySelector('p'),
    'ファイル6をダウンロードし、<code>.gz</code>のままBigLeafで開いてください。Cmd-O、BigLeafウインドウへのドラッグ、Dockアイコンへのドロップが使えます。先に展開しないでください。gzipを直接開けること自体がBigLeafの機能です。展開サイズが100MBを超えると、数秒以内にPreviewバナーが表示されます。'
  );

  var headers = document.querySelectorAll('.sample-table th');
  ['ファイル', '実測サイズ', '確認できる機能'].forEach(function (label, index) {
    bilingual(headers[index], label);
  });

  var rows = document.querySelectorAll('.sample-table tbody tr');
  var japaneseSizes = [
    '10.7 MB<br><code>10737481 バイト</code><br>44,336 レコード',
    '5.4 MB<br><code>5368911 バイト</code><br>22,176 要素',
    '<code>1347 バイト</code>',
    '2.1 MB<br><code>2147493 バイト</code><br>9,021 レコード',
    '2.1 MB<br><code>2147559 バイト</code>',
    '62.6 MB ダウンロード<br><code>62585542 バイト</code><br>358 MB 展開後<br>1,551,570 レコード'
  ];
  var japaneseFeatures = [
    'レコード一覧＋詳細ツリー、仮想スクロール、レコード番号指定ジャンプ、キャンセル可能な進捗付き部分一致検索 <code>error</code>（1,489件）、正規表現 <code>timeout after \\d+s</code>（163件）、ハイライト、スニペット、ミニマップ、<strong>Filter Matches</strong>、Edit &gt; <strong>Find Next</strong> / <strong>Find Previous</strong>、4種類のコピー操作。',
    'ルートが配列の単一JSONドキュメント。Root-Array JSONの閲覧を確認できます。',
    '配列ではないルートのTree-Only View。6種の文字体系、境界値、8階層のネストでCopy Key Pathを確認できます。',
    '意図的に不正な行を含みます。BigLeafは停止せずUnparsed Recordsとして保持します。<code>GARBAGE</code>を検索すると181件見つかります。',
    '<code>.log</code>拡張子のJSONL。ファイル名ではなく内容から形式を判定することを確認できます。',
    'gzipの直接オープン、Preview Mode（先頭10,000レコード）、Previewバナー、買い切り購入、表示中の<strong>Restore</strong>ボタン、永続インデックスキャッシュ。BigLeafでは358 MB、Finderでは10進単位のため約376 MBと表示される場合があります。'
  ];
  rows.forEach(function (row, index) {
    if (!japaneseSizes[index] || !japaneseFeatures[index]) return;
    var cells = row.querySelectorAll('td');
    bilingual(cells[1], japaneseSizes[index]);
    bilingual(cells[2], japaneseFeatures[index]);
  });

  bilingual(callouts[1] && callouts[1].querySelector('h2'), '期待される動作');
  var expectedItems = callouts[1] ? callouts[1].querySelectorAll('li') : [];
  [
    'Preview Modeでは検索とジャンプの対象は先頭10,000レコードです。購入後はファイル全体が対象になります。',
    'Previewバナーの<strong>Restore</strong>を押すと過去の購入を復元します。購入履歴がない場合は、エラーダイアログを出さずPreview Modeのままです。',
    'ブラウザがダウンロード時に自動展開した場合も、展開後のJSONLで同じPreview Modeと購入フローを確認できます。',
    '1,551,570レコードのこのサンプルでも、ストア掲載の21.5 GB / 100 GB実測でも、索引方式と操作モデルは同じです。',
    'Reload（Cmd-R）は開いているファイルが増えた後に再索引する機能のため、静的ダウンロードだけでは確認できません。任意: 10 MBサンプルを開いた状態で <code>echo \'{"level":"info","msg":"appended"}\' &gt;&gt; bigleaf-sample-10mb.jsonl</code> を実行し、Cmd-Rを押してください。'
  ].forEach(function (copy, index) {
    bilingual(expectedItems[index], copy);
  });

  bilingual(document.querySelector('footer a[href="privacy.html"]'), 'プライバシーポリシー');
  bilingual(document.querySelector('footer a[href="support.html"]'), 'サポート');
  bilingual(document.querySelector('footer .fine > span:last-child'), 'macOS 14+ · Apple silicon &amp; Intel対応');
})();
