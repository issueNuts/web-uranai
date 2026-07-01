/*
 * 「今日の一歩」ワンオラクル — アプリ本体
 *
 * ブラウザだけで完結する。サーバー送信・個人情報の保存は一切しない。
 * 引き方は透明に: 大アルカナ22枚 × 正位置/逆位置 から、乱数で公平に1枚。
 * 読みは cards.js（honest-language.md 準拠）から取り出して表示するだけ。
 */
(function () {
  "use strict";

  // X / note の育成日記リンク。開設したらここに URL を入れる。
  // 空のままなら、デッドリンクにせず「（準備中）」と表示する。
  var SITE_LINKS = {
    x: "https://x.com/sodateru_uranai",  // 育成日記アカウント（仮・#0005）
    note: ""   // 例: "https://note.com/＜アカウント＞"
  };

  // シェア時にカードに載せる、このアプリ自身の公開URL（OGP大カードが出る）。
  var APP_URL = "https://issuenuts.github.io/web-uranai/";

  var cards = window.TAROT_CARDS || [];

  var els = {
    worry: document.getElementById("worry"),
    drawBtn: document.getElementById("draw-btn"),
    result: document.getElementById("result"),
    intro: document.getElementById("intro"),
    cardFace: document.getElementById("card-face"),
    cardEmoji: document.getElementById("card-emoji"),
    cardName: document.getElementById("card-name"),
    cardOrient: document.getElementById("card-orient"),
    yourWorry: document.getElementById("your-worry"),
    theme: document.getElementById("r-theme"),
    question: document.getElementById("r-question"),
    push: document.getElementById("r-push"),
    step: document.getElementById("r-step"),
    againBtn: document.getElementById("again-btn"),
    shareXBtn: document.getElementById("share-x-btn"),
    copyBtn: document.getElementById("copy-btn"),
    copyNote: document.getElementById("copy-note"),
    linkX: document.getElementById("link-x"),
    linkNote: document.getElementById("link-note")
  };

  // 育成日記リンクを反映。URL 未設定ならデッドリンクにせず「準備中」にする。
  function applyLink(el, url, openLabel) {
    if (!el) return;
    if (url) {
      el.setAttribute("href", url);
      el.setAttribute("target", "_blank");
      el.textContent = openLabel;
    } else {
      el.removeAttribute("href");
      el.classList.add("pending-link");
      el.textContent = openLabel + "（準備中）";
    }
  }
  applyLink(els.linkX, SITE_LINKS.x, "X で育成日記を見る・感想を送る");
  applyLink(els.linkNote, SITE_LINKS.note, "note で詳しい育成日記を読む");

  // 公平な1枚引き: カード番号と正逆を乱数で選ぶ
  function drawOne() {
    var idx = Math.floor(Math.random() * cards.length);
    var card = cards[idx];
    var isReversed = Math.random() < 0.5;
    var reading = isReversed ? card.reversed : card.upright;
    return {
      card: card,
      isReversed: isReversed,
      orientLabel: isReversed ? "逆位置" : "正位置",
      reading: reading
    };
  }

  function render(draw) {
    var worryText = (els.worry.value || "").trim();

    els.cardEmoji.textContent = draw.card.emoji || "🔮";
    els.cardName.textContent = draw.card.num + " " + draw.card.name;
    els.cardOrient.textContent = "（" + draw.orientLabel + "）";
    els.cardFace.classList.toggle("reversed", draw.isReversed);

    if (worryText) {
      els.yourWorry.textContent = "あなたの一言: " + worryText;
      els.yourWorry.hidden = false;
    } else {
      els.yourWorry.hidden = true;
    }

    els.theme.textContent = draw.reading.theme;
    els.question.textContent = draw.reading.question;
    els.push.textContent = draw.reading.push;
    els.step.textContent = draw.reading.step;

    els.intro.hidden = true;
    els.result.hidden = false;
    els.copyNote.hidden = true;

    // 結果へやさしくスクロール
    els.result.scrollIntoView({ behavior: "smooth", block: "start" });

    // 共有用テキストを保持
    els.copyBtn.dataset.share = buildShareText(draw);
  }

  function buildShareText(draw) {
    return [
      "🔮 今日のあなたへ —— " + draw.card.name + "（" + draw.orientLabel + "）",
      "",
      "【今日のテーマ】 " + draw.reading.theme,
      "【問いかけ】 " + draw.reading.question,
      "【背中を押す一言】 " + draw.reading.push,
      "【小さな次の一歩】 " + draw.reading.step,
      "",
      "※エンタメ・自己理解のための内容です。一つの見方として参考にしてみてください。",
      "#今日の一歩"
    ].join("\n");
  }

  function onDraw() {
    if (!cards.length) {
      els.intro.textContent = "カードを読み込めませんでした。ページを再読み込みしてみてください。";
      return;
    }
    render(drawOne());
  }

  function onCopy() {
    var text = els.copyBtn.dataset.share || "";
    if (!text) return;

    var done = function () {
      els.copyNote.hidden = false;
    };
    var fallback = function () {
      // クリップボードAPIが使えない環境（古いブラウザ・file:// 等）向け
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  // X のシェア画面をひらく（結果テキスト＋このアプリのURL）。投稿するかは本人が決める。
  function onShareX() {
    var text = els.copyBtn.dataset.share || "";
    if (!text) return;
    var url = "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(text + "\n") + "&url=" + encodeURIComponent(APP_URL);
    window.open(url, "_blank", "noopener");
  }

  els.drawBtn.addEventListener("click", onDraw);
  els.againBtn.addEventListener("click", onDraw);
  els.shareXBtn.addEventListener("click", onShareX);
  els.copyBtn.addEventListener("click", onCopy);
})();
