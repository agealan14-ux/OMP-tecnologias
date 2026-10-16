(() => {
  const campaign = document.querySelector("#offer-campaign");
  if (!campaign) return;

  // Vigencia: 20 oct 2026 00:00 a 10 nov 2026 00:00 en Argentina (UTC-3).
  // Son exactamente 21 días; la hora UTC de la API se compara con estos instantes UTC.
  const OFFER_START_UTC_MS = 1_792_465_200_000;
  const OFFER_END_UTC_MS = 1_794_279_600_000;
  const UTC_API = "https://worldtime.timezone.io/api/timezone/Etc/UTC";
  const RESYNC_INTERVAL_MS = 10 * 60 * 1000;
  const RETRY_INTERVAL_MS = 30 * 1000;

  const label = campaign.querySelector("#offer-countdown-label");
  const daysOutput = campaign.querySelector("[data-countdown-days]");
  const hoursOutput = campaign.querySelector("[data-countdown-hours]");
  const minutesOutput = campaign.querySelector("[data-countdown-minutes]");
  const secondsOutput = campaign.querySelector("[data-countdown-seconds]");

  let serverTimeMs = null;
  let synchronizedAt = null;
  let displayInterval = null;
  let resyncInterval = null;
  let retryTimeout = null;

  const currentInternetTime = () => {
    if (serverTimeMs === null || synchronizedAt === null) return null;
    return serverTimeMs + (performance.now() - synchronizedAt);
  };

  const removeExpiredCampaign = () => {
    campaign.remove();
    clearInterval(displayInterval);
    clearInterval(resyncInterval);
    clearTimeout(retryTimeout);
  };

  const updateCountdown = () => {
    const now = currentInternetTime();
    if (now === null) return;
    if (now >= OFFER_END_UTC_MS) {
      removeExpiredCampaign();
      return;
    }

    campaign.hidden = false;
    const waitingToStart = now < OFFER_START_UTC_MS;
    const target = waitingToStart ? OFFER_START_UTC_MS : OFFER_END_UTC_MS;
    label.textContent = waitingToStart
      ? "La oferta comienza en"
      : "La oferta termina en";

    const remainingSeconds = Math.max(0, Math.floor((target - now) / 1000));
    const days = Math.floor(remainingSeconds / 86_400);
    const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
    const minutes = Math.floor((remainingSeconds % 3_600) / 60);
    const seconds = remainingSeconds % 60;

    daysOutput.textContent = String(days).padStart(2, "0");
    hoursOutput.textContent = String(hours).padStart(2, "0");
    minutesOutput.textContent = String(minutes).padStart(2, "0");
    secondsOutput.textContent = String(seconds).padStart(2, "0");
  };

  const syncWithInternet = async () => {
    if (!campaign.isConnected) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(UTC_API, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("No se pudo consultar la hora UTC.");

      const result = await response.json();
      if (!Number.isFinite(result.unixtime)) {
        throw new Error("La respuesta no contiene una hora UTC válida.");
      }

      serverTimeMs = result.unixtime * 1000;
      synchronizedAt = performance.now();
      clearTimeout(retryTimeout);
      updateCountdown();
      if (serverTimeMs < OFFER_END_UTC_MS && resyncInterval === null) {
        resyncInterval = setInterval(syncWithInternet, RESYNC_INTERVAL_MS);
      }
    } catch {
      // Si no se puede validar la hora online, la campaña permanece oculta.
      if (!campaign.isConnected) return;
      retryTimeout = setTimeout(syncWithInternet, RETRY_INTERVAL_MS);
    } finally {
      clearTimeout(timeout);
    }
  };

  displayInterval = setInterval(updateCountdown, 1000);
  syncWithInternet();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncWithInternet();
  });
})();
