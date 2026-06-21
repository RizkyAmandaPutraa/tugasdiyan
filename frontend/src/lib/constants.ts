import { Database, Code, Key, ShieldAlert, Network, Cookie, FileText, Lock, Server, Search, Settings, Users } from "lucide-react";

export const SCAN_MODULES = [
  { id: 'sql', name: 'SQL Injection Scanner', icon: Database, description: "Mendeteksi potensi celah injeksi kode SQL pada parameter URL dan formulir." },
  { id: 'xss', name: 'XSS Scanner', icon: Code, description: "Memeriksa kemungkinan eksekusi skrip lintas situs melalui input yang tidak di-sanitasi." },
  { id: 'jwt', name: 'JWT Security Test', icon: Key, description: "Memvalidasi mekanisme token JWT: algoritma, signature, dan ekspirasi." },
  { id: 'csrf', name: 'CSRF Audit', icon: ShieldAlert, description: "Mencari keberadaan token anti-CSRF pada setiap formulir yang ditemukan." },
  { id: 'api', name: 'API Security Scanner', icon: Network, description: "Memeriksa konfigurasi CORS dan keterbukaan data sensitif pada endpoint API." },
  { id: 'cookie', name: 'Session Cookie Audit', icon: Cookie, description: "Memverifikasi atribut HttpOnly dan Secure pada cookie sesi/autentikasi." },
  { id: 'header', name: 'Security Header Check', icon: FileText, description: "Menganalisis respons header HTTP: CSP, X-Frame-Options, HSTS, dsb." },
  { id: 'https', name: 'HTTPS Validation', icon: Lock, description: "Memastikan website beroperasi penuh di atas SSL/TLS." },
  { id: 'server', name: 'Server Information Audit', icon: Server, description: "Mendeteksi apakah server membocorkan versi atau teknologi yang digunakan." },
  { id: 'crawl', name: 'Internal Page Crawling', icon: Search, description: "Menelusuri halaman dan direktori secara otomatis untuk menemukan aset tersembunyi." },
  { id: 'config', name: 'Security Configuration Detection', icon: Settings, description: "Memeriksa kesesuaian konfigurasi server dengan standar keamanan terkini." },
  { id: 'admin', name: 'Admin Panel Discovery', icon: Users, description: "Mencoba mengakses path umum panel admin untuk menguji keterpaparan akses." }
];

export const getSuccessExplanation = (id: string) => {
  switch (id) {
    case 'sql': return "Tidak ditemukan pola input yang mengizinkan injeksi kode SQL. Parameter pada URL dan formulir tampaknya telah di-filter atau menggunakan parameterized queries dengan baik.";
    case 'xss': return "Tidak ada potensi eksekusi script lintas situs (XSS). Seluruh input dari pengguna telah dibersihkan (sanitized) dan di-escape sebelum ditampilkan kembali di halaman web.";
    case 'jwt': return "Implementasi JWT aman. Tidak ada kerentanan terhadap serangan penggantian algoritma 'none' dan mekanisme signature tervalidasi dengan baik.";
    case 'csrf': return "Token Anti-CSRF yang unik telah ditemukan di formulir web. Situs ini terlindungi dari aksi manipulasi paksa lintas situs (Cross-Site Request Forgery).";
    case 'api': return "Endpoint API terlindungi dengan baik. Tidak mengekspos data sensitif secara publik dan sistem kontrol akses beroperasi dengan konfigurasi CORS yang aman.";
    case 'cookie': return "Cookie otentikasi / sesi telah diatur dengan atribut 'HttpOnly' dan 'Secure', mengamankannya dari pencurian via script (XSS) dan pemantauan jaringan (Sniffing).";
    case 'header': return "Header keamanan HTTP kritis (seperti Content-Security-Policy dan X-Frame-Options) terkonfigurasi dengan tepat untuk menangkal serangan Clickjacking dan Code Injection.";
    case 'https': return "Website beroperasi penuh di atas SSL/TLS (HTTPS), memastikan integritas dan enkripsi data (End-to-End Encryption) antara perangkat pengguna dan server.";
    case 'server': return "Sistem tidak membocorkan versi web server (seperti versi spesifik Nginx/Apache) atau informasi teknologi backend yang dapat mempermudah pengintaian (Profiling) oleh peretas.";
    case 'crawl': return "Proses crawler otomatis tidak menemukan direktori sensitif, file konfigurasi tersembunyi (.env), atau dokumen cadangan (.bak) yang terekspos ke internet.";
    case 'config': return "Deteksi konfigurasi keamanan mendapati infrastruktur server beroperasi sesuai dengan praktik standar keamanan terbaik (Security Best Practices).";
    case 'admin': return "Panel administrasi tidak ditemukan pada path yang umum atau mudah ditebak (misalnya /admin, /administrator, /login). Hal ini menekan risiko serangan brute-force.";
    default: return "Sistem memvalidasi modul ini dengan sukses. Tidak ada anomali atau celah keamanan yang terdeteksi.";
  }
};
