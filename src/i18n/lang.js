const KEY = "nil_lang";

const dict = {
  fa: {
    helix01_title: "دوره فراگیری مربی‌گری مدار هِلیکس ۰۱",
    helix02_title: "دوره فراگیری مربی‌گری مدار هِلیکس ۰۲",
    subtitle: "ویدئوهای ضبط‌شده و پادکست‌های جلسات",
    video: "ویدئو",
    podcast: "پادکست",
    logout: "خروج",
  },
  en: {
    helix01_title: "Helix 01 Coaching Orbit Course",
    helix02_title: "Helix 02 Coaching Orbit Course",
    subtitle: "Recorded videos and session podcasts",
    video: "Video",
    podcast: "Podcast",
    logout: "Logout",
  },
};

export function getLang() {
  const saved = localStorage.getItem(KEY);
  return saved === "en" ? "en" : "fa";
}
export function setLang(l) {
  localStorage.setItem(KEY, l === "en" ? "en" : "fa");
}
export function STR(key) {
  const l = getLang();
  return dict[l][key] ?? key;
}
