const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log(
  "📦 Running post-installation setup for KAAF Noticeboard Backend v2.2.0...",
);

// Create necessary directories
const directories = [
  "./logs",
  "./logs/archives",
  "./uploads",
  "./uploads/notices",
  "./uploads/profiles",
  "./backups",
  "./backups/archives",
  "./backups/temp",
  "./certificates",
  "./public",
  "./temp",
  "./test-results",
  "./coverage",
  "./data/exports",
];

directories.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

if (process.platform !== "win32") {
  try {
    execSync("chmod -R 755 ./logs ./uploads ./backups ./temp", {
      stdio: "ignore",
    });
    console.log("🔐 Set directory permissions");
  } catch (error) {}
}

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  const sampleEnv = `# ============================================
# KAAF Noticeboard Backend Configuration
# Environment: Development/Production
# ============================================

# Application Settings
NODE_ENV=development
PORT=5000
APP_NAME=KAAF Noticeboard Backend
APP_URL=http://localhost:5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/kaaf_noticeboard
MONGODB_URI_PROD=mongodb://localhost:27017/kaaf_noticeboard_prod

# Redis Configuration (for Bull queues and caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URLs
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PROD=https://yourdomain.com

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@kaafnoticeboard.com

# SMS Configuration (TextBee Gateway)
SMS_ENABLED=false
TEXTBEE_API_URL=https://api.textbee.dev/api/v1/gateway
TEXTBEE_API_KEY=your-textbee-api-key
TEXTBEE_DEVICE_ID=your-device-id
TEXTBEE_SENDER_NAME=KAAF Noticeboard

# Web Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
LOG_ERROR_FILE=./logs/error.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Rate Limiting
RATE_LIMIT_ENABLED=true
DISABLE_RATE_LIMIT=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Security
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Monitoring & Analytics
SENTRY_DSN=your-sentry-dsn
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ANALYTICS=true

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30
BACKUP_CRON_SCHEDULE=0 2 * * *

# Maintenance Mode
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=System under maintenance. Please check back later.

# API Documentation
SWAGGER_ENABLED=true
SWAGGER_BASE_PATH=/api-docs
`;
  fs.writeFileSync(envPath, sampleEnv);
  console.log("📝 Created .env configuration file");
  console.log(
    "⚠️  IMPORTANT: Update the .env file with your actual credentials!",
  );
} else {
  console.log("✅ .env file already exists");
}

const envExamplePath = path.join(process.cwd(), ".env.example");
if (!fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envPath, envExamplePath);
  console.log("📝 Created .env.example for team reference");
}

const gitignorePath = path.join(process.cwd(), ".gitignore");
if (!fs.existsSync(gitignorePath)) {
  const gitignore = `# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env.production
.env.staging

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Uploads
uploads/
temp/
tmp/

# Backups
backups/
*.backup
*.dump

# Certificates
certificates/
*.key
*.pem
*.crt

# Test coverage
coverage/
.nyc_output/
test-results/
junit.xml
test-report.html

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db
desktop.ini

# PM2
.pm2/
pm2-*.log

# Docker
docker-compose.override.yml
.docker/

# Redis
dump.rdb

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Application specific
*.pid
*.seed
*.lock
`;
  fs.writeFileSync(gitignorePath, gitignore);
  console.log("📝 Created .gitignore file");
}

const nodeVersion = process.version;
const requiredVersion = "v18.0.0";
const currentVersion = nodeVersion.slice(1);
const required = requiredVersion.slice(1);

if (parseFloat(currentVersion) < parseFloat(required)) {
  console.warn(
    `⚠️  Warning: Node.js ${nodeVersion} detected. Required: >= ${requiredVersion}`,
  );
  console.warn(
    "   Please upgrade Node.js for optimal performance and security",
  );
} else {
  console.log(`✅ Node.js version: ${nodeVersion}`);
}

try {
  const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.warn("⚠️  Could not determine npm version");
}

console.log("\n" + "=".repeat(50));
console.log("✅ Post-installation setup complete!");
console.log("=".repeat(50));

console.log("\n📋 Setup Summary:");
console.log(`   • Directories created: ${directories.length}`);
console.log(
  `   • Configuration: ${fs.existsSync(envPath) ? "✅ .env ready" : "⚠️ .env missing"}`,
);
console.log(`   • Git ignore: ${fs.existsSync(gitignorePath) ? "✅" : "⚠️"}`);

console.log("\n🚀 Next Steps:");
console.log("   1. ⚙️  Update your .env file with actual credentials");
console.log("   2. 🗄️  Ensure MongoDB is running (mongod)");
console.log("   3. 📦 Start Redis server (required for queues): redis-server");
console.log("   4. 💻 Run development server: npm run dev");
console.log("   5. 🌱 Seed test data: npm run seed");
console.log("   6. 🧪 Run tests: npm test");
console.log("   7. 📊 Monitor queues: npm run queue:monitor");
console.log("   8. 🔄 Start worker processes: npm run dev:worker");

console.log("\n📚 Useful Commands:");
console.log(
  "   • npm run dev:all     - Start all services (app, worker, cron, monitor)",
);
console.log("   • npm run health      - Check system health");
console.log("   • npm run status      - View application status");
console.log("   • npm run swagger     - Generate API documentation");
console.log("   • npm run pm2:start   - Production deployment with PM2");

console.log("\n💡 Need help?");
console.log("   • Documentation: npm run docs");
console.log("   • API Docs: npm run swagger:serve");
console.log(
  "   • Issues: https://github.com/SAMUELBOAKYE/kaaf-noticeboard-backend/issues\n",
);
