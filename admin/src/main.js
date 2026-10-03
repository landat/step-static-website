import CMS from "@sveltia/cms";
import { formatContent } from "./content-format.js";

// Russian on the first visit; preserve a language explicitly chosen later.
try {
  const key = "sveltia-cms.prefs";
  const prefs = JSON.parse(localStorage.getItem(key) || "{}");
  if (!prefs.locale) localStorage.setItem(key, JSON.stringify({ ...prefs, locale: "ru" }));
} catch {
  // The CMS will report unavailable browser storage itself.
}

CMS.registerCustomFormat("json", "json", { fromFile: JSON.parse, toFile: formatContent });
CMS.init();
