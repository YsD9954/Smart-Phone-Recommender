// // backend/controllers/chatController.js
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// dotenv.config();

// // --- Initialize Gemini client (best-effort) ---
// let genAI = null;
// let model = null;
// try {
//   genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   // Use plain model name (no "models/"). If your SDK/version supports a different name, change here.
//   model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// } catch (e) {
//   console.warn("⚠️ Gemini client init failed — continuing with deterministic fallbacks.", e?.message || e);
// }

// // --- Load dataset (safe path) ---
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const PHONES_PATH = path.resolve(__dirname, "../data/phones.json");

// let phones = [];
// try {
//   const raw = fs.readFileSync(PHONES_PATH, "utf-8");
//   phones = JSON.parse(raw);
//   console.log(`✅ Loaded ${phones.length} phones`);
// } catch (err) {
//   console.error("❌ Error loading phones data:", err.message || err);
//   phones = []; // keep running, but dataset empty
// }

// // --- Small utilities ---
// const normalize = (s = "") => String(s || "").toLowerCase().trim();

// function parseBudgetFromQuery(q = "") {
//   if (!q) return null;
//   const qLow = q.toLowerCase();
//   const kMatch = qLow.match(/(\d{1,3})\s*k\b/); // "30k"
//   if (kMatch) return parseInt(kMatch[1], 10) * 1000;
//   const numMatch = qLow.match(/(?:under|around|about|<=|<)?\s*₹?\s?([\d,]{3,7})/);
//   if (numMatch) return parseInt(numMatch[1].replace(/,/g, ""), 10);
//   return null;
// }

// function detectCompare(q = "") {
//   if (!q) return null;
//   const r = q.match(/compare\s+(.+?)\s+(?:vs|and|v|vs\.|vs:)\s+(.+)/i);
//   if (r) return { left: r[1].trim(), right: r[2].trim() };
//   const r2 = q.match(/(.+?)\s+vs\s+(.+)/i);
//   if (r2) return { left: r2[1].trim(), right: r2[2].trim() };
//   return null;
// }

// function detectDetailRequest(q = "") {
//   if (!q) return null;
//   const m = q.match(/(?:tell me more about|tell me more|more details about|details of|i like this phone|show more about)\s*(.*)/i);
//   if (m) return (m[1] || "").trim();
//   return null;
// }

// function detectFeature(q = "") {
//   if (!q) return null;
//   const features = ["camera", "battery", "storage", "performance", "charging", "display", "compact", "gaming", "one-hand", "one hand", "fast charging"];
//   const low = q.toLowerCase();
//   for (const f of features) if (low.includes(f)) return f;
//   return null;
// }

// function tokenMatchScore(name, query) {
//   const nameTokens = normalize(name).split(/\s+/).filter(Boolean);
//   const qTokens = normalize(query).split(/\s+/).filter(Boolean);
//   if (!qTokens.length) return 0;
//   const matched = qTokens.filter(t => nameTokens.some(n => n.includes(t))).length;
//   return matched / qTokens.length;
// }

// function fuzzyFindByName(queryName) {
//   if (!queryName || !phones.length) return null;
//   const q = normalize(queryName);

//   // exact brand+name or name
//   const exact = phones.find(p => normalize(`${p.brand} ${p.name}`) === q || normalize(p.name) === q);
//   if (exact) return exact;

//   // includes
//   const includes = phones.find(p => normalize(`${p.brand} ${p.name}`).includes(q) || normalize(p.name).includes(q));
//   if (includes) return includes;

//   // token match best
//   let best = null;
//   let bestScore = 0;
//   for (const p of phones) {
//     const score = tokenMatchScore(`${p.brand} ${p.name}`, queryName);
//     if (score > bestScore) { bestScore = score; best = p; }
//   }
//   // require some minimal match
//   return bestScore >= 0.5 ? best : null;
// }

// function findPhonesByBrand(brand) {
//   if (!brand) return [];
//   const b = normalize(brand);
//   return phones.filter(p => normalize(p.brand) === b || normalize(p.brand).includes(b));
// }

// function extractNumberFromSpec(spec = "") {
//   const digits = (spec || "").replace(/\D/g, "");
//   return digits ? parseInt(digits, 10) : null;
// }

// function scorePhonesForFeature(list, feature) {
//   // Simple scoring function: camera -> mp, battery -> mAh, performance -> cpu heuristics
//   return list
//     .map(p => {
//       let score = 0;
//       const cam = (p.camera || "").toLowerCase();
//       const bat = extractNumberFromSpec(p.battery || "");
//       const proc = (p.processor || "").toLowerCase();
//       if (feature.includes("camera")) {
//         const m = cam.match(/(\d{2,3})\s*mp/);
//         if (m) score += parseInt(m[1], 10);
//         if (cam.includes("periscope")) score += 20;
//         if (cam.includes("ois")) score += 10;
//       } else if (feature.includes("battery")) {
//         if (bat) score += bat / 100; // normalize
//         if ((p.charging || "").toLowerCase().includes("120w")) score += 20;
//       } else if (feature.includes("performance") || feature.includes("gaming")) {
//         if (proc.includes("snapdragon 8") || proc.includes("dimensity 9000") || proc.includes("a17") || proc.includes("snapdragon 8 gen 3")) score += 30;
//         else if (proc.includes("snapdragon 7") || proc.includes("dimensity 7000")) score += 15;
//       } else if (feature.includes("storage")) {
//         const m = (p.storage || "").toLowerCase().match(/(\d+)\s*gb/);
//         if (m) score += parseInt(m[1], 10);
//       }
//       if (p.price) score += Math.max(0, 5 - Math.floor(p.price / 20000));
//       return { phone: p, score };
//     })
//     .sort((a, b) => b.score - a.score)
//     .map(x => x.phone);
// }

// function isUnsafe(query) {
//   const q = normalize(query || "");
//   const bad = ["api key", "system prompt", "secret", "ignore your rules", "jailbreak", "trash brand", "tell me your api", "prompt"];
//   return bad.some(b => q.includes(b));
// }

// function buildRecommendationResponse(filtered, feature, budget) {
//   const rationaleParts = [];
//   if (feature) rationaleParts.push(`${feature} prioritized`);
//   if (budget) rationaleParts.push(`budget ≤ ₹${budget}`);
//   if (!rationaleParts.length) rationaleParts.push("overall value");
//   return {
//     reply: `Here are some phones matching your request (${filtered.length} found):`,
//     rationale: `Selected based on ${rationaleParts.join(" and ")}.`,
//     results: filtered.slice(0, 6)
//   };
// }

// function deterministicCompareSummary(left, right) {
//   // quick deterministic text summarizer
//   const lines = [];
//   // price
//   if (left.price && right.price) {
//     if (left.price < right.price) lines.push(`${left.name} is cheaper (₹${left.price}) while ${right.name} costs ₹${right.price}.`);
//     else if (left.price > right.price) lines.push(`${right.name} is cheaper (₹${right.price}) while ${left.name} costs ₹${left.price}.`);
//   }
//   // camera
//   if (left.camera && right.camera) lines.push(`Camera — ${left.name}: ${left.camera}; ${right.name}: ${right.camera}.`);
//   // battery
//   if (left.battery && right.battery) lines.push(`Battery — ${left.name}: ${left.battery}; ${right.name}: ${right.battery}.`);
//   // processor
//   if (left.processor && right.processor) lines.push(`Performance — ${left.processor} vs ${right.processor}.`);
//   // tradeoff conclusion
//   let conclusion = "";
//   // decide rough winner for performance: look for "snapdragon 8" etc.
//   const perfScore = (p) => {
//     const proc = (p.processor||"").toLowerCase();
//     if (proc.includes("snapdragon 8") || proc.includes("dimensity 9000") || proc.includes("a17")) return 3;
//     if (proc.includes("snapdragon 7") || proc.includes("dimensity 7000")) return 2;
//     return 1;
//   };
//   const leftPerf = perfScore(left), rightPerf = perfScore(right);
//   const leftBat = extractNumberFromSpec(left.battery || 0) || 0;
//   const rightBat = extractNumberFromSpec(right.battery || 0) || 0;

//   if (leftPerf > rightPerf) conclusion = `${left.name} is stronger for performance and gaming.`;
//   else if (rightPerf > leftPerf) conclusion = `${right.name} is stronger for performance and gaming.`;

//   if (leftBat > rightBat) conclusion += ` ${left.name} also has better battery endurance.`;
//   else if (rightBat > leftBat) conclusion += ` ${right.name} has better battery endurance.`;

//   if (!conclusion) conclusion = "Both phones have different strengths — choose based on whether you prefer camera, battery, or raw performance.";
//   return `${lines.join(" ")} ${conclusion}`;
// }

// // --- Main handler ---
// export const chatHandler = async (req, res) => {
//   try {
//     const { message } = req.body || {};
//     if (!message || !String(message).trim()) {
//       return res.status(200).json({
//         reply: "Please ask a valid question!",
//         ai_reply: "Please type something about phones (e.g., 'Best camera phone under ₹30k').",
//         results: []
//       });
//     }
//     const query = String(message).trim();

//     // safety
//     if (isUnsafe(query)) {
//       return res.status(200).json({
//         reply: "Sorry, cannot assist with that request.",
//         ai_reply: "I can't share secrets, API keys, or internal prompts. I can help with phones instead.",
//         results: []
//       });
//     }

//     // 1) Knowledge-based quick answers (like OIS vs EIS)
//     const kb = {
//       "ois vs eis": `OIS (Optical Image Stabilization) is hardware-based stabilization using moving lens elements — great for low-light photos. EIS (Electronic Image Stabilization) is software-based and helps smooth video by aligning frames. Many phones use both.`,
//       "difference between ois and eis": `OIS uses moving optical elements; EIS uses software frame alignment. OIS helps photos in low light, EIS improves video smoothness.`,
//       "what is ois": `OIS (Optical Image Stabilization) = hardware lens stabilization, reduces blur from hand shake.`,
//       "what is eis": `EIS (Electronic Image Stabilization) = software stabilization, improves video smoothness.`
//     };
//     for (const k of Object.keys(kb)) {
//       if (query.toLowerCase().includes(k)) {
//         return res.status(200).json({ reply: kb[k], ai_reply: kb[k], results: [] });
//       }
//     }

//     // 2) Compare intent
//     const cmp = detectCompare(query);
//     if (cmp) {
//       const leftPhone = fuzzyFindByName(cmp.left);
//       const rightPhone = fuzzyFindByName(cmp.right);
//       const final = {
//         reply: `Comparison: ${leftPhone?.name || cmp.left} vs ${rightPhone?.name || cmp.right}`,
//         left: leftPhone,
//         right: rightPhone
//       };

//       // If either missing, respond deterministically
//       if (!leftPhone || !rightPhone) {
//         const msg = "Could not find one or both models to compare. Use full model names if possible.";
//         return res.status(200).json({ ...final, ai_reply: msg });
//       }

//       // Try LLM for friendly summary; fallback to deterministic summary
//       const aiPrompt = `
// You are a concise smartphone assistant. The user asked: "${query}".
// Use only the structured data provided. Produce a 3-5 line human-friendly comparison highlighting camera, battery, performance, and which phone to pick for gaming vs photography.
// Structured data:
// ${JSON.stringify({ left: leftPhone, right: rightPhone, tradeoffs: [] }, null, 2)}
// End with a follow-up: "Would you like alternatives or a deeper comparison?"
// `;
//       if (model) {
//         try {
//           const result = await model.generateContent(aiPrompt);
//           const aiText = result?.response?.text?.();
//           return res.status(200).json({ ...final, ai_reply: aiText || deterministicCompareSummary(leftPhone, rightPhone) });
//         } catch (err) {
//           console.warn("⚠️ LLM compare failed — using deterministic fallback.", err?.message || err);
//         }
//       }
//       // deterministic fallback
//       const det = deterministicCompareSummary(leftPhone, rightPhone);
//       return res.status(200).json({ ...final, ai_reply: det });
//     }

//     // 3) Detail request "I like this phone, tell me more"
//     const detailQ = detectDetailRequest(query);
//     if (detailQ) {
//       let phone = fuzzyFindByName(detailQ);
//       // also try query itself
//       if (!phone) phone = fuzzyFindByName(query);
//       if (!phone) {
//         return res.status(200).json({
//           reply: "Sorry, I couldn't find that model.",
//           ai_reply: "I couldn't find that exact model in my catalog. Try using the full model name.",
//           results: []
//         });
//       }

//       const final = { reply: `Details for ${phone.name}:`, details: phone };
//       const aiPrompt = `
// You are a helpful assistant. The user requested details for: "${phone.name}".
// From this phone data produce a 3-line summary: highlight camera, battery, and one unique selling point. End with: "Would you like pricing or alternatives?"
// Phone:
// ${JSON.stringify(phone, null, 2)}
// `;
//       if (model) {
//         try {
//           const result = await model.generateContent(aiPrompt);
//           const aiText = result?.response?.text?.();
//           return res.status(200).json({ ...final, ai_reply: aiText || `Camera: ${phone.camera}. Battery: ${phone.battery}. Processor: ${phone.processor}. Would you like pricing or alternatives?` });
//         } catch (err) {
//           console.warn("⚠️ LLM details failed — fallback.", err?.message || err);
//         }
//       }
//       // deterministic fallback
//       const fallbackText = `Camera: ${phone.camera}. Battery: ${phone.battery}. Processor: ${phone.processor}. Would you like pricing or alternatives?`;
//       return res.status(200).json({ ...final, ai_reply: fallbackText });
//     }

//     // 4) Recommendation / Filters
//     const budget = parseBudgetFromQuery(query);
//     const feature = detectFeature(query);
//     const brands = [...new Set(phones.map(p => normalize(p.brand)))];
//     const matchedBrand = brands.find(b => query.toLowerCase().includes(b));

//     let results = phones.slice();
//     if (matchedBrand) results = findPhonesByBrand(matchedBrand);
//     if (budget) results = results.filter(p => p.price && p.price <= budget);
//     if (feature) results = scorePhonesForFeature(results, feature);
//     else results = results.sort((a,b) => (a.price || 0) - (b.price || 0));

//     // 5) If nothing matches -> friendly fallback (LLM preferred, deterministic otherwise)
//     if (!results.length) {
//       const fallbackPrompt = `
// You are SmartPhone Genie.
// User: "${query}"
// You do not have live web data. Suggest 2-3 phones from the dataset below as helpful examples and ask a follow-up question.
// Dataset sample:
// ${JSON.stringify(phones.slice(0, 6), null, 2)}
// `;
//       if (model) {
//         try {
//           const result = await model.generateContent(fallbackPrompt);
//           const aiText = result?.response?.text?.();
//           return res.status(200).json({ reply: "No direct match found.", ai_reply: aiText || "I don't have live data, but examples from my catalog include OnePlus 12R and Pixel 8a. Would you like camera or battery picks?" , results: phones.slice(0,3) });
//         } catch (err) {
//           console.warn("⚠️ LLM fallback failed — deterministic fallback used.", err?.message || err);
//         }
//       }
//       return res.status(200).json({
//         reply: "No direct match found.",
//         ai_reply: "I couldn't find phones matching your filters. As examples, OnePlus 12R and Pixel 8a are strong picks — would you like camera or battery-focused options?",
//         results: phones.slice(0,3)
//       });
//     }

//     // 6) Build recommendation response and try LLM for friendly phrasing
//     const finalRec = buildRecommendationResponse(results, feature, budget);
//     const topTwo = finalRec.results.slice(0,2);
//     const aiPrompt = `
// You are SmartPhone Genie, a friendly smartphone assistant.
// User asked: "${query}"
// Here are top matches (JSON):
// ${JSON.stringify(topTwo, null, 2)}
// Write a 3-line conversational reply that:
// - Starts friendly ("Here's what I'd suggest 👇")
// - Mentions top 2 phones and why (camera/battery/performance/value)
// - Ends with: "Would you like me to compare them?"
// Don't invent specs.
// `;
//     if (model) {
//       try {
//         const result = await model.generateContent(aiPrompt);
//         const aiText = result?.response?.text?.();
//         return res.status(200).json({ ...finalRec, ai_reply: aiText || `Here's what I'd suggest 👇 ${topTwo[0].name} — strong for camera; ${topTwo[1].name} — better battery/performance. Would you like me to compare them?` });
//       } catch (err) {
//         console.warn("⚠️ LLM recommendation failed — deterministic fallback used.", err?.message || err);
//       }
//     }
//     // deterministic reply:
//     const deterministic = `Here's what I'd suggest 👇 ${topTwo[0].name} — ${topTwo[0].camera || "good camera"}, ${topTwo[0].battery || ""}. ${topTwo[1] ? `${topTwo[1].name} — ${topTwo[1].camera || ""}, ${topTwo[1].battery || ""}.` : ""} Would you like me to compare them?`;
//     return res.status(200).json({ ...finalRec, ai_reply: deterministic });

//   } catch (err) {
//     console.error("chatHandler error:", err?.message || err);
//     return res.status(500).json({
//       reply: "Internal server error",
//       ai_reply: "Server error — please try again later.",
//       results: []
//     });
//   }
// };

// backend/controllers/chatController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- Cross-platform absolute path setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const phonesPath = path.join(__dirname, "../data/phones.json");

// --- Load and clean phone dataset safely ---
let phones = [];
try {
  if (fs.existsSync(phonesPath)) {
    const raw = fs.readFileSync(phonesPath, "utf8");
    const parsed = JSON.parse(raw);

    phones = parsed
      .filter((p) => p && (p.name || p.Name))
      .map((p) => {
        const name = (p.name ?? p.Name ?? "").toString().trim();
        const brand = (p.brand ?? p.Brand ?? "Unknown").toString().trim();
        const priceRaw = p.price ?? p.Price ?? 0;
        const camera = p.camera ?? p.Camera ?? "N/A";
        const battery = p.battery ?? p.Battery ?? "N/A";
        const display = p.display ?? p.Display ?? "N/A";
        const processor = p.processor ?? p.Processor ?? "N/A";
        const storage = p.storage ?? p.Storage ?? "N/A";
        const price =
          typeof priceRaw === "number"
            ? priceRaw
            : parseInt(String(priceRaw).replace(/[₹,]/g, "")) || 0;

        return {
          Name: name || "Unknown Model",
          Brand: brand,
          Price: price,
          Camera: String(camera),
          Battery: String(battery),
          Display: String(display),
          Processor: String(processor),
          Storage: String(storage),
        };
      });

    console.log(`✅ Loaded ${phones.length} phones successfully.`);
  } else {
    console.error("❌ phones.json not found at:", phonesPath);
  }
} catch (err) {
  console.error("❌ Error reading phones.json:", err);
}

// --- Helper functions ---
const extractPrice = (text) => {
  const m = text.match(/(?:under|below|less than)\s*₹?\s*(\d+)\s*(k|K)?/i);
  if (!m) return null;
  let v = parseInt(m[1], 10);
  if (m[2]) v *= 1000;
  return v;
};

const parseBatteryMah = (s) => {
  if (!s) return 0;
  const m = String(s).match(/(\d{3,5})\s*m?a?h?/i);
  return m ? parseInt(m[1], 10) : 0;
};

const parseChargingW = (s) => {
  if (!s) return 0;
  const m = String(s).match(/(\d{1,3})\s*W/i);
  return m ? parseInt(m[1], 10) : 0;
};

const parseDisplayInches = (s) => {
  if (!s) return null;
  const m =
    String(s).match(/(\d+(?:\.\d+)?)\s*-?\s*inch/i) ||
    String(s).match(/(\d+(?:\.\d+)?)\s*"/);
  return m ? parseFloat(m[1]) : null;
};

const fuzzyMatchPhone = (query, phoneName) => {
  if (!query || !phoneName) return false;
  const q = query.toLowerCase();
  const n = phoneName.toLowerCase();
  if (n.includes(q)) return true;
  const qtokens = q.split(/\s+/).filter(Boolean);
  return qtokens.every((t) => n.includes(t));
};

const batteryScore = (p) => {
  const mAh = parseBatteryMah(p.Battery);
  const w = parseChargingW(p.Battery);
  return mAh + w * 200;
};

const findPhones = (fn) => phones.filter(fn);

// --- Chat handler ---
export const chatHandler = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Please enter a message." });

    const userMsgRaw = String(message);
    const userMsg = userMsgRaw.toLowerCase().trim();

    // --- Intent detection ---
    const isCompare = userMsg.includes("compare");
    const isCameraQuery =
      userMsg.includes("camera") &&
      (userMsg.includes("best") || userMsg.includes("top"));
    const isBatteryQuery = /battery|charging|fast charge/i.test(userMsgRaw);
    const isCompact = /compact|small|one hand/i.test(userMsgRaw);
    const isExplain =
      userMsg.includes("explain") || /what is ois|eis|amoled|soc/i.test(userMsgRaw);
    const isBrandPrice =
      userMsg.includes("under") ||
      userMsg.includes("below") ||
      userMsg.includes("less than");
    const isDetails =
      userMsg.includes("tell me more") ||
      userMsg.includes("details") ||
      userMsg.startsWith("show me ");
    const isGreeting = /^(hi|hello|hey|good (morning|evening))\b/i.test(userMsgRaw);

    // --- Compare ---
    if (isCompare) {
      const vsParts = userMsgRaw
        .replace(/compare/i, "")
        .split(/\s+vs\s+|\s+v\s+|versus/i)
        .map((s) => s.trim())
        .filter(Boolean);
      if (vsParts.length >= 2) {
        const [leftQ, rightQ] = vsParts;
        const phone1 = phones.find(
          (p) =>
            fuzzyMatchPhone(leftQ, p.Name) ||
            fuzzyMatchPhone(leftQ, `${p.Brand} ${p.Name}`)
        );
        const phone2 = phones.find(
          (p) =>
            fuzzyMatchPhone(rightQ, p.Name) ||
            fuzzyMatchPhone(rightQ, `${p.Brand} ${p.Name}`)
        );

        if (!phone1 || !phone2)
          return res.json({
            reply:
              "Sorry, I couldn't find both models. Try exact names like 'Compare Pixel 8a vs OnePlus 12R'.",
          });

        const p1_batt = parseBatteryMah(phone1.Battery);
        const p2_batt = parseBatteryMah(phone2.Battery);
        const p1_charge = parseChargingW(phone1.Battery);
        const p2_charge = parseChargingW(phone2.Battery);

        const verdict =
          p1_batt > p2_batt
            ? `${phone1.Name} offers better battery life.`
            : `${phone2.Name} offers better battery life.`;

        return res.json({
          reply: `📱 Comparison — ${phone1.Name} vs ${phone2.Name}\n\n🔹 ${phone1.Name} (${phone1.Brand}) — ₹${phone1.Price}\nCamera: ${phone1.Camera}\nBattery: ${phone1.Battery}\nProcessor: ${phone1.Processor}\n\n🔸 ${phone2.Name} (${phone2.Brand}) — ₹${phone2.Price}\nCamera: ${phone2.Camera}\nBattery: ${phone2.Battery}\nProcessor: ${phone2.Processor}\n\n💡 Verdict: ${verdict}`,
        });
      }
      return res.json({
        reply:
          "Use format: Compare <phone1> vs <phone2> (e.g., Compare Pixel 8a vs OnePlus 12R).",
      });
    }

    // --- Camera query ---
    if (isCameraQuery) {
      const priceLimit = extractPrice(userMsg) ?? 30000;
      const results = findPhones((p) => p.Price <= priceLimit)
        .sort((a, b) => {
          const mpa = (a.Camera.match(/(\d{2,3})\s*mp/i) || [0, 0])[1] | 0;
          const mpb = (b.Camera.match(/(\d{2,3})\s*mp/i) || [0, 0])[1] | 0;
          return mpb - mpa;
        })
        .slice(0, 5);
      if (!results.length)
        return res.json({
          reply: `Sorry, no camera-focused phones under ₹${priceLimit}.`,
        });

      const out = results
        .map(
          (p, i) =>
            `${i + 1}. ${p.Name} (${p.Brand}) — ₹${p.Price}\nCamera: ${p.Camera}\nBattery: ${p.Battery}`
        )
        .join("\n\n");
      return res.json({ reply: `📸 Top camera phones under ₹${priceLimit}:\n\n${out}` });
    }

    // --- Battery query ---
    if (isBatteryQuery) {
      const priceLimit = extractPrice(userMsg) ?? 20000;
      const results = findPhones((p) => p.Price <= priceLimit)
        .map((p) => ({ phone: p, score: batteryScore(p) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      if (!results.length)
        return res.json({
          reply: `Sorry, couldn't find phones under ₹${priceLimit} with good battery info.`,
        });

      const out = results
        .map(
          (s, i) =>
            `${i + 1}. ${s.phone.Name} (${s.phone.Brand}) — ₹${s.phone.Price}\nBattery: ${s.phone.Battery}\nProcessor: ${s.phone.Processor}`
        )
        .join("\n\n");
      return res.json({ reply: `🔋 Battery kings under ₹${priceLimit}:\n\n${out}` });
    }

    // --- Compact phones ---
    if (isCompact) {
      const results = phones
        .map((p) => ({ ...p, inches: parseDisplayInches(p.Display) }))
        .filter((x) => x.inches && x.inches <= 6.3)
        .sort((a, b) => a.inches - b.inches)
        .slice(0, 5);
      if (!results.length)
        return res.json({
          reply: "Sorry, no compact phones found (under ~6.3 inches).",
        });
      const out = results
        .map(
          (p, i) =>
            `${i + 1}. ${p.Name} (${p.Brand}) — ${p.inches}"\n₹${p.Price}\nCamera: ${p.Camera}`
        )
        .join("\n\n");
      return res.json({ reply: `📱 Compact / one-hand phones:\n\n${out}` });
    }

    // --- Explain terms ---
    if (isExplain) {
      if (/ois|eis/i.test(userMsgRaw))
        return res.json({
          reply:
            "📷 OIS (Optical Image Stabilization) is hardware-based for steadier photos.\nEIS (Electronic Image Stabilization) is software-based for smoother videos.\nMany phones use both together.",
        });
      if (/amoled/i.test(userMsgRaw))
        return res.json({
          reply:
            "🖥️ AMOLED = Active Matrix OLED. Each pixel emits light individually for deep blacks and vibrant colors.",
        });
      if (/soc/i.test(userMsgRaw))
        return res.json({
          reply:
            "⚙️ SoC (System on Chip) — integrates CPU, GPU, and modem; it defines overall performance.",
        });
    }

    // --- Brand + Price query ---
    if (isBrandPrice) {
      const priceLimit = extractPrice(userMsg) ?? 25000;
      const brandName = phones.find((p) =>
        userMsg.includes(p.Brand.toLowerCase())
      )?.Brand;
      const results = findPhones(
        (p) =>
          (!brandName || p.Brand.toLowerCase() === brandName.toLowerCase()) &&
          p.Price <= priceLimit
      )
        .sort((a, b) => a.Price - b.Price)
        .slice(0, 5);
      if (!results.length)
        return res.json({
          reply: `Sorry, no phones found under ₹${priceLimit}.`,
        });
      const out = results
        .map(
          (p, i) =>
            `${i + 1}. ${p.Name} (${p.Brand}) — ₹${p.Price}\nCamera: ${p.Camera}\nBattery: ${p.Battery}`
        )
        .join("\n\n");
      return res.json({
        reply: `📱 ${brandName || "Top"} phones under ₹${priceLimit}:\n\n${out}`,
      });
    }

    // --- Details query ---
    if (isDetails) {
      const match = phones.find(
        (p) =>
          fuzzyMatchPhone(userMsg, p.Name) ||
          fuzzyMatchPhone(userMsg, `${p.Brand} ${p.Name}`)
      );
      if (!match)
        return res.json({
          reply: "Sorry, I couldn’t find that model in the list.",
        });
      return res.json({
        reply: `📱 ${match.Name} (${match.Brand})\n💰 ₹${match.Price}\n📷 ${match.Camera}\n🔋 ${match.Battery}\n🖥️ ${match.Display}\n⚙️ ${match.Processor}\n💾 ${match.Storage}`,
      });
    }

    // --- Greetings ---
    if (isGreeting) {
      return res.json({
        reply:
          "👋 Hey there! I'm your Phone Assistant.\nTry asking:\n- Best camera phone under 30k\n- Battery king around 15k\n- Compare Pixel 8a vs OnePlus 12R",
      });
    }

    // --- Default fallback ---
    return res.json({
      reply: "Sorry, that’s out of my scope right now.",
    });
  } catch (err) {
    console.error("chatHandler error:", err);
    return res.status(500).json({ error: "Error generating reply." });
  }
};
