const HEALTH_URL = "https://arthur-portfolio-yi47.onrender.com/health";

addEventListener("scheduled", (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(HEALTH_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Arthur health check returned HTTP ${response.status}`);
      }

      const health = await response.json();
      if (health.status !== "ok") {
        throw new Error("Arthur health check returned an unexpected response");
      }
    })(),
  );
});
