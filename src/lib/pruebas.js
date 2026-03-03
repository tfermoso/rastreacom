// pruebas.js
const { analyzeSite } = require("./analyzeSite");

async function test() {
  const urls = [
    "https://www.teconsite.com/",
    "https://www.adigal.com/",
    "https://www.f10informatica.es/",
  ];

  // Ejecuta en serie para no “pisar” rate limits y que sea más fácil de seguir en clase
  const results = [];
  for (const url of urls) {
    const result = await analyzeSite(url, {
      maxUrls: 8,
      defaultCountryCode: "+34",
      includeVisited: true,
    });
    results.push(result);
  }

  // Comparativa simple
  console.table(
    results.map((r) => ({
      url: r.url,
      name: r.name,
      emails: r.emails?.length ?? 0,
      phones: r.phones?.length ?? 0,
      visited: r.visited?.length ?? 0,
      error: r.error ?? "",
    }))
  );

  // Detalle completo por sitio
  for (const r of results) {
    console.log("\n==============================");
    console.log("URL:", r.url);
    console.log("NAME:", r.name);
    console.log("EMAILS:", r.emails);
    console.log("PHONES:", r.phones);
    console.log("VISITED:", r.visited);
    if (r.error) console.log("ERROR:", r.error);
  }
}

test().catch(console.error);