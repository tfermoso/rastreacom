// src/lib/ai/normalizeExtraction.js
const { getAiClient } = require("./client");

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function simpleFallback(result) {
  return {
    ...result,
    name: (result.name || "").trim(),
    emails: uniq((result.emails || []).map(e => String(e).trim().toLowerCase()))
      .filter(e => e.includes("@")), // micro-filtro
    phones: uniq((result.phones || []).map(p => String(p).trim())),
    visited: uniq((result.visited || []).map(v => String(v).trim())),
    sector: (result.sector || "").trim(),
    bestEmail: (result.bestEmail || "").trim().toLowerCase(),
    bestPhone: (result.bestPhone || "").trim(),
    quality: result.quality || { confidence: 0.0, warnings: [] },
  };
}

async function normalizeExtractionWithAI(result, opts = {}) {
  const enabled = String(process.env.AI_NORMALIZE_ENABLED || "false") === "true";
  if (!enabled) return simpleFallback(result);

  const client = getAiClient();
  const model = process.env.AI_MODEL_NORMALIZE || "openai/gpt-4o-mini";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);

  const raw = {
    url: result.url || "",
    name: result.name || "",
    emails: Array.isArray(result.emails) ? result.emails : [],
    phones: Array.isArray(result.phones) ? result.phones : [],
    visited: Array.isArray(result.visited) ? result.visited : [],
    error: result.error || "",
    // si ya traes sector por otro lado, pásalo como pista
    sectorHint: opts.sector || result.sector || "",
    // opcional: si algún día pasas texto (título/meta/fragmentos) la clasificación mejora muchísimo
    // textHint: opts.text || ""
  };

  // ✅ incluye sector + bestEmail/bestPhone en el schema
  const schema = {
    url: "string",
    name: "string",
    sector: "string (etiqueta corta, ej: 'taller mecánico', 'restaurante', 'abogado', 'clínica dental')",
    emails: "string[]",
    phones: "string[]",
    visited: "string[]",
    bestEmail: "string",
    bestPhone: "string",
    error: "string",
    quality: { confidence: "number(0..1)", warnings: "string[]" }
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await client.chat.completions.create(
      {
        model,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "Eres un normalizador de datos de un rastreador web que analiza páginas de empresas en España. " +
              "Devuelve SOLO JSON válido (sin markdown ni texto extra). " +
              "No inventes datos: si un campo no existe usa '' o []. " +
              "Limpia y normaliza siguiendo estas reglas: " +
              "- name: elimina espacios duplicados y evita nombres genéricos ('Inicio','Home','Contacto'). Si es genérico, usa ''. " +
              "- emails: minúsculas, formato válido, sin comas ni espacios, sin duplicados. " +
              "- phones: elimina prefijos como 'tel:'/'telefono:', quita separadores, deja el número más limpio. " +
              "- phones: si parece español, normaliza con prefijo +34. Elimina números claramente inválidos o demasiado cortos. " +
              "- visited: URLs únicas y recortadas. " +
              "- bestEmail: el email más probable de contacto (prioriza info@, contacto@, ventas@; evita no-reply). " +
              "- bestPhone: el teléfono principal (el más completo). " +
              "- sector: clasifica el negocio con una etiqueta corta (2-4 palabras) usando name/url/visited y pistas disponibles. " +
              "  Si no puedes inferirlo con seguridad, usa '' y añade warning. " +
              "- quality.confidence: 0..1 según fiabilidad. " +
              "- quality.warnings: lista de problemas detectados."
          },
          {
            role: "user",
            content:
              "RAW:\n" + JSON.stringify(raw) +
              "\n\nESQUEMA (orientativo):\n" + JSON.stringify(schema) +
              "\n\nDevuelve el JSON normalizado (solo JSON).",
          },
        ],
      },
      { signal: controller.signal }
    );

    const text = resp.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return simpleFallback(result);
    }

    // ✅ recoge sector + bestEmail/bestPhone
    const normalized = {
      url: typeof parsed.url === "string" ? parsed.url : raw.url,
      name: typeof parsed.name === "string" ? parsed.name : raw.name,

      sector: typeof parsed.sector === "string" ? parsed.sector : (raw.sectorHint || ""),

      emails: Array.isArray(parsed.emails) ? parsed.emails : raw.emails,
      phones: Array.isArray(parsed.phones) ? parsed.phones : raw.phones,
      visited: Array.isArray(parsed.visited) ? parsed.visited : raw.visited,

      bestEmail: typeof parsed.bestEmail === "string" ? parsed.bestEmail : "",
      bestPhone: typeof parsed.bestPhone === "string" ? parsed.bestPhone : "",

      error: typeof parsed.error === "string" ? parsed.error : raw.error,
      quality: parsed.quality || { confidence: 0.0, warnings: ["quality missing"] },
    };

    return simpleFallback(normalized);
  } catch (e) {
    return simpleFallback(result);
  } finally {
    clearTimeout(t);
  }
}

module.exports = { normalizeExtractionWithAI };