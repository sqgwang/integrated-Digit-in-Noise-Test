// js/i18n.js
const translations = {
  english: {
    introTitle: "Welcome to the integrated digit-in-noise test!",
    introText: "This test measures your ability to hear numbers in background noise. You will hear sequences of three digits and then repeat them.",
    introNote: "Please use wired headphones and be in a quiet room.",
    infoTitle: "Participant information",
    gender: "Gender (required)",
    age: "Age",
    education: "Education years",
    pid: "Participant ID (optional)",
    stimLang: "Stimulus language (audio)",
    whichTest: "Which test?",
    calibTitle: "Calibration",
    calibText: "Please connect wired headphones. Use the slider to adjust the background noise until the noise is comfortably audible.",
    noiseGainLabel: "Noise level",
    resultsTitle: "Results"    
  },
  mandarin: {
    introTitle: "欢迎尝试噪声下数字整合测试！",
    introText: "该测试用于测量您在背景噪声下听取数字的能力。您将听到三位数字序列并重复它们。",
    introNote: "请使用有线耳机并在安静环境下进行测试。",
    infoTitle: "参与者信息",
    gender: "性别（必填）",
    age: "年龄",
    education: "受教育年数",
    pid: "测试编号（可选）",
    stimLang: "刺激语言（音频）",
    whichTest: "选择测试",
    calibTitle: "校准",
    calibText: "请连接有线耳机。用滑块调整背景噪声到一个舒适的音量。",
    noiseGainLabel: "噪声音量",
    resultsTitle: "测试结果"    
  }
};

function setUILanguage(lang) {
  localStorage.setItem('uiLang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = (translations[lang] && translations[lang][key]) || (translations['english'][key]) || key;
    el.textContent = text;
  });
}

// === i18n additions ===
// 1) 扩展翻译表（只增不改原 keys）
Object.assign(translations.english, {
  languageLabel: "Language",
  start: "Start test",
  proceed: "Proceed to calibration",
  chooseConditions: "Select test conditions (check any)",
  condHelp: "You may select one or more conditions.",
  calibConfirm: "Confirm and Start Test",
  playNoise: "Play noise",
  stop: "Stop",

  // test page
  condTitle: "Condition",
  play: "Play",
  ok: "OK",
  nextCond: "Next Condition",
  playHint: "After playback, type the digits and press OK.",
  backspace: "Backspace",
  progressTrial: "Trial {i}/{N}",
  introPractice: "{label} — Practice {p}/3. Click Play to start.",
  introFormal: "{label} — Trial {i}/{N}. Click Play to start.",

  // condition labels (for UI 展示)
  cond_2f: "2-digit forward",
  cond_2b: "2-digit backward",
  cond_3f: "3-digit forward",
  cond_3b: "3-digit backward",
  cond_5f: "5-digit forward",

  // results
  resultsTitle2: "Results",
  perCondMetrics: "Per-condition metrics",
  diffsTitle: "Differences",
  noCond: "No condition results to show.",
  noDiff: "No differences to show.",
  thCondition: "Condition",
  thSRT: "SRT (dB)",
  thRTAll: "RT (all) ms",
  thRTCorrect: "RT (correct) ms",
  dlJson: "Download JSON",
  dlCsv: "Download CSV (trials)",
  returnHome: "Return Home"
});
Object.assign(translations.mandarin, {
  languageLabel: "语言",
  start: "开始测试",
  proceed: "进入校准",
  chooseConditions: "选择测试条件（可多选）",
  condHelp: "可以选择一个或多个条件。",
  calibConfirm: "确认并开始测试",
  playNoise: "播放噪声",
  stop: "停止",

  // test page
  condTitle: "测试条件",
  play: "播放",
  ok: "确定",
  nextCond: "进入下一个条件",
  playHint: "播放结束后，请输入数字并点击“确定”。",
  backspace: "退格",
  progressTrial: "第 {i}/{N} 条",
  introPractice: "{label} — 练习 {p}/3。点击“播放”开始。",
  introFormal: "{label} — 第 {i}/{N} 条。点击“播放”开始。",

  // condition labels
  cond_2f: "2位顺背",
  cond_2b: "2位倒背",
  cond_3f: "3位顺背",
  cond_3b: "3位倒背",
  cond_5f: "5位顺背",

  // results
  resultsTitle2: "测试结果",
  perCondMetrics: "各条件指标",
  diffsTitle: "差值",
  noCond: "暂无可显示的条件结果。",
  noDiff: "暂无可显示的差值。",
  thCondition: "条件",
  thSRT: "SRT（dB）",
  thRTAll: "平均反应时（全部）ms",
  thRTCorrect: "平均反应时（正确）ms",
  dlJson: "下载 JSON",
  dlCsv: "下载 CSV（试次）",
  returnHome: "返回首页"
});

// 2) 简单取词 + 占位符替换
function t(key, vars) {
  const lang = localStorage.getItem('uiLang') || 'english';
  const fall = (translations['english'] && translations['english'][key]) || key;
  let s = (translations[lang] && translations[lang][key]) || fall;
  if (vars && typeof s === 'string') {
    s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
  }
  return s;
}
window.t = t;

// 3) 让 setUILanguage 支持属性翻译（不改函数名/签名）
const _origSetUILanguage = setUILanguage;
setUILanguage = function(lang) {
  _origSetUILanguage(lang);
  // 处理带 data-i18n-attr 的元素，如 title/placeholder 等
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (key && attr) {
      const val = (translations[lang] && translations[lang][key]) || (translations['english'][key]) || key;
      el.setAttribute(attr, val);
    }
  });
  // 触发一个事件，便于页面脚本在语言切换后刷新动态文案
  document.dispatchEvent(new CustomEvent('uiLanguageChanged', { detail: { lang }}));
};

// === Segmented language init (通用) ===
function initSegmentedLanguage() {
  const seg = document.getElementById('uiLangSeg');
  const select = document.getElementById('uiLang');
  if (!seg || !select) return;

  const radios = seg.querySelectorAll('input[name="segLang"]');
  const apply = (lang) => {
    if (select) select.value = lang;
    localStorage.setItem('uiLang', lang);
    setUILanguage(lang);
    radios.forEach(r => r.checked = (r.value === lang));
  };

  // 初始化：读取本地语言或当前下拉
  const saved = localStorage.getItem('uiLang') || select.value || 'english';
  apply(saved);

  // 分段切换 -> 应用语言
  seg.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'segLang') apply(e.target.value);
  });

  // 下拉切换（兜底）-> 同步分段
  select.addEventListener('change', () => apply(select.value));
}
document.addEventListener('DOMContentLoaded', initSegmentedLanguage);

translations.english.infoHeading = translations.english.infoHeading || "Participant Information";
translations.mandarin.infoHeading = translations.mandarin.infoHeading || "参与者信息";

// Ensure info page strings exist
translations.english.infoTitle   = translations.english.infoTitle   || "Participant Information";
translations.mandarin.infoTitle  = translations.mandarin.infoTitle  || "参与者信息";
translations.english.infoHeading = translations.english.infoHeading || "Participant Information";
translations.mandarin.infoHeading= translations.mandarin.infoHeading|| "参与者信息";

// --- info page extra keys (ensure i18n works on options and labels) ---
translations.english.male = translations.english.male || "Male";
translations.mandarin.male = translations.mandarin.male || "男";

translations.english.female = translations.english.female || "Female";
translations.mandarin.female = translations.mandarin.female || "女";

translations.english.other = translations.english.other || "Other";
translations.mandarin.other = translations.mandarin.other || "其他";

translations.english.participantId = translations.english.participantId || "Participant ID";
translations.mandarin.participantId = translations.mandarin.participantId || "参与者编号";

translations.english.mandarin = translations.english.mandarin || "Mandarin";
translations.mandarin.mandarin = translations.mandarin.mandarin || "普通话";
translations.english.cantonese = translations.english.cantonese || "Cantonese";
translations.mandarin.cantonese = translations.mandarin.cantonese || "粤语";
translations.english.british_english = translations.english.british_english || "British_English";
translations.mandarin.british_english = translations.mandarin.british_english || "英国英语";
translations.english.ningboese = translations.english.ningboese || "Ningboese";
translations.mandarin.ningboese = translations.mandarin.ningboese || "宁波话";
translations.english.hangzhouese = translations.english.hangzhouese || "Hangzhouese";
translations.mandarin.hangzhouese = translations.mandarin.hangzhouese || "杭州话";
translations.english.min = translations.english.min || "Min";
translations.mandarin.min = translations.mandarin.min || "闽南语";
translations.english.fuzhouese = translations.english.fuzhouese || "Fuzhouese";
translations.mandarin.fuzhouese = translations.mandarin.fuzhouese || "福州话";

// 只翻译 title 的轻量扩展：不会改元素的 innerHTML
(function () {
  if (typeof window.setUILanguage !== 'function') return;
  const _orig = window.setUILanguage;
  window.setUILanguage = function (lang) {
    _orig(lang);
    const dict = (window.translations && (window.translations[lang] || window.translations.english)) || {};
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = (dict && dict[key]) || key;
      el.setAttribute('title', val);
    });
  };
})();

