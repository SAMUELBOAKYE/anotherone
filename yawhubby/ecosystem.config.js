module.exports = {
  apps: [
    {
      name: "kaaf-noticeboard-api",
      script: "server.js",

      // Cluster Mode Settings
      instances: process.env.INSTANCES || "max",
      exec_mode: "cluster",
      instance_var: "INSTANCE_ID",

      // Environment Variables
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        PM2_INSTANCE: true,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
        DEBUG: "kaaf:*",
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 5001,
        LOG_LEVEL: "info",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        LOG_LEVEL: "warn",
        SENTRY_ENABLED: true,
      },

      // Performance Settings
      max_memory_restart: process.env.MAX_MEMORY || "1G",
      node_args: [
        "--max-old-space-size=512",
        "--optimize-for-size",
        "--gc-interval=100",
        "--max-semi-space-size=64",
      ].join(" "),

      // Restart Strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000,
      listen_timeout: 15000,
      shutdown_with_message: true,

      // Logging Configuration
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      log_type: "json",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,

      // File Watching (Development only)
      watch:
        process.env.NODE_ENV === "development"
          ? [
              "server.js",
              "cluster.js",
              "config",
              "controllers",
              "models",
              "routes",
              "middleware",
              "utils",
              "services",
            ]
          : false,
      ignore_watch: [
        "node_modules",
        "logs",
        "uploads",
        "coverage",
        "test-results",
        "backups",
        "certificates",
        ".git",
        "tmp",
        "temp",
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: true,
        interval: 1000,
        binaryInterval: 3000,
      },

      // Error Handling
      kill_retry_time: 3000,
      force: false,

      // Monitoring
      metrics: {
        http: true,
        event_loop_delay: true,
        heap_size: true,
        http_latency: true,
      },

      increment_var: "PORT",

      // Lifecycle Hooks
      post_update: ["npm install", "npm run db:migrate"],
      pre_start: "npm run db:validate",
      post_start: 'echo "✅ API application started successfully"',
      pre_stop: 'echo "🛑 Stopping API application..."',
      post_stop: 'echo "✅ API application stopped"',
    },

    {
      name: "kaaf-noticeboard-worker",
      script: "workers/queueWorker.js",
      instances: 2,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        WORKER_TYPE: "all",
      },
      env_development: {
        NODE_ENV: "development",
        WORKER_TYPE: "all",
        DEBUG: "worker:*",
      },
      env_production: {
        NODE_ENV: "production",
        WORKER_TYPE: "all",
        QUEUE_CONCURRENCY: 5,
      },

      max_memory_restart: "512M",
      node_args: "--max-old-space-size=256",

      autorestart: true,
      max_restarts: 5,
      min_uptime: "10s",
      restart_delay: 5000,
      kill_timeout: 8000,

      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,

      watch: false,

      post_start: 'echo "📦 Worker started successfully"',
      pre_stop: 'echo "🛑 Stopping worker..."',
    },

    {
      name: "kaaf-noticeboard-cron",
      script: "scripts/cronJobs.js",
      instances: 1,
      exec_mode: "fork",

      // Environment Configuration
      env: {
        NODE_ENV: "production",
        CRON_ENABLED: "true",
        LOG_LEVEL: "info",
      },
      env_development: {
        NODE_ENV: "development",
        CRON_ENABLED: "true",
        DEBUG: "cron:*",
        LOG_LEVEL: "debug",
      },
      env_staging: {
        NODE_ENV: "staging",
        CRON_ENABLED: "true",
        LOG_LEVEL: "info",
      },
      env_production: {
        NODE_ENV: "production",
        CRON_ENABLED: "true",
        LOG_LEVEL: "warn",
        SENTRY_ENABLED: "true",
      },

      // Performance & Memory
      max_memory_restart: "512M",
      node_args: ["--max-old-space-size=256", "--optimize-for-size"].join(" "),

      // Restart Strategy
      autorestart: true,
      max_restarts: 5,
      min_uptime: "30s",
      restart_delay: 10000,
      kill_timeout: 15000,
      exp_backoff_restart_delay: 100,

      // Logging Configuration
      error_file: "./logs/cron-error.log",
      out_file: "./logs/cron-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,
      log_type: "json",

      // File Watching (Disabled for cron)
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],

      // Cron-specific settings
      cron_restart: "0 0 * * *", // Restart daily at midnight
      cron_options: {
        name: "cron-scheduler",
        timezone: "Africa/Accra", // Adjust to your timezone
      },

      // Lifecycle Hooks
      pre_start: 'echo "⏰ Initializing cron scheduler..."',
      post_start: 'echo "✅ Cron scheduler started successfully"',
      pre_stop: 'echo "🛑 Stopping cron scheduler..."',
      post_stop: 'echo "✅ Cron scheduler stopped"',
      pre_restart: 'echo "🔄 Restarting cron scheduler..."',
      post_restart: 'echo "✅ Cron scheduler restarted"',
    },

    {
      name: "kaaf-noticeboard-health",
      script: "scripts/healthCheck.js",
      instances: 1,
      exec_mode: "fork",

      // Environment Configuration
      env: {
        NODE_ENV: "production",
        CHECK_INTERVAL: "60000", // Check every minute
        HEALTH_CHECK_TIMEOUT: "30000",
        ALERT_ENABLED: "true",
      },
      env_development: {
        NODE_ENV: "development",
        CHECK_INTERVAL: "30000",
        HEALTH_CHECK_TIMEOUT: "10000",
        ALERT_ENABLED: "false",
        DEBUG: "health:*",
      },
      env_production: {
        NODE_ENV: "production",
        CHECK_INTERVAL: "60000",
        HEALTH_CHECK_TIMEOUT: "30000",
        ALERT_ENABLED: "true",
        SLACK_WEBHOOK: process.env.SLACK_WEBHOOK,
      },

      // Performance & Memory
      max_memory_restart: "256M",
      node_args: "--max-old-space-size=128",

      // Restart Strategy
      autorestart: true,
      max_restarts: 3,
      min_uptime: "20s",
      restart_delay: 5000,
      kill_timeout: 10000,
      exp_backoff_restart_delay: 100,

      // Logging Configuration
      error_file: "./logs/health-error.log",
      out_file: "./logs/health-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      time: true,

      // File Watching (Disabled)
      watch: false,

      // Cron restart for health checker
      cron_restart: "*/5 * * * *", // Restart every 5 minutes

      // Lifecycle Hooks
      pre_start: 'echo "❤️ Initializing health monitor..."',
      post_start: 'echo "✅ Health monitor started successfully"',
      pre_stop: 'echo "🛑 Stopping health monitor..."',
      post_stop: 'echo "✅ Health monitor stopped"',
    },

    {
      name: "kaaf-noticeboard-logrotate",
      script: "scripts/logRotate.js",
      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        ROTATE_INTERVAL: "24h",
        MAX_SIZE: "100M",
        RETAIN_DAYS: "30",
        COMPRESS: "true",
      },

      max_memory_restart: "128M",
      autorestart: true,
      max_restarts: 2,
      min_uptime: "10s",
      restart_delay: 10000,

      error_file: "./logs/logrotate-error.log",
      out_file: "./logs/logrotate-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      cron_restart: "0 */6 * * *", // Restart every 6 hours

      post_start: 'echo "🔄 Log rotation service started"',
    },

    {
      name: "kaaf-noticeboard-perfmon",
      script: "scripts/performanceMonitor.js",
      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        MONITOR_INTERVAL: "30000",
        METRICS_ENABLED: "true",
      },

      max_memory_restart: "256M",
      autorestart: true,
      max_restarts: 3,
      min_uptime: "30s",

      error_file: "./logs/perfmon-error.log",
      out_file: "./logs/perfmon-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      post_start: 'echo "📊 Performance monitor started"',
    },

    {
      name: "kaaf-noticeboard-backup",
      script: "scripts/backupService.js",
      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        BACKUP_ENABLED: "true",
        BACKUP_SCHEDULE: "0 2 * * *", // 2 AM daily
        BACKUP_RETENTION_DAYS: "7",
      },

      max_memory_restart: "512M",
      autorestart: true,
      max_restarts: 2,
      restart_delay: 15000,

      error_file: "./logs/backup-error.log",
      out_file: "./logs/backup-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      cron_restart: "0 2 * * *", // Restart at 2 AM daily

      post_start: 'echo "💾 Backup service started"',
    },
  ],

  deploy: {
    // Production Deployment
    production: {
      user: process.env.DEPLOY_USER || "deploy",
      host: process.env.DEPLOY_HOST || "your-server-ip",
      ref: process.env.DEPLOY_BRANCH || "origin/main",
      repo: "git@github.com:SAMUELBOAKYE/kaaf-noticeboard-backend.git",
      path: process.env.DEPLOY_PATH || "/var/www/kaaf-noticeboard",

      // Pre-deployment hooks
      "pre-setup": 'echo "🔧 Starting deployment setup..."',
      "post-setup": 'echo "✅ Deployment setup completed"',

      // Deployment commands
      "pre-deploy": 'echo "📦 Preparing for deployment..."',
      "post-deploy": `
        echo "🚀 Deploying application..."
        npm install --production
        npm run db:migrate
        npm run db:seed:prod
        npm run cache:clear
        pm2 reload ecosystem.config.js --env production
        pm2 save
        pm2 restart kaaf-noticeboard-cron
        pm2 restart kaaf-noticeboard-health
        echo "✅ Deployment completed successfully"
      `,

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // Deployment options
      "pre-deploy-local": "npm run test && npm run security:check",
      "post-deploy-local": 'echo "🎉 Deployment finished"',

      // SSH options
      ssh_options: "StrictHostKeyChecking=no",
      deep: true,
    },

    // Staging Deployment
    staging: {
      user: process.env.DEPLOY_USER || "deploy",
      host: process.env.STAGING_HOST || "staging-server-ip",
      ref: "origin/develop",
      repo: "git@github.com:SAMUELBOAKYE/kaaf-noticeboard-backend.git",
      path: "/var/www/kaaf-noticeboard-staging",

      "pre-deploy": 'echo "📦 Deploying to staging..."',
      "post-deploy": `
        npm install
        npm run db:migrate
        npm run db:seed
        pm2 reload ecosystem.config.js --env staging
        pm2 save
        echo "✅ Staging deployment completed"
      `,

      env: {
        NODE_ENV: "staging",
        PORT: 5001,
      },

      ssh_options: "StrictHostKeyChecking=no",
    },

    // Backup Deployment
    backup: {
      user: "backup",
      host: "backup-server-ip",
      ref: "origin/main",
      repo: "git@github.com:SAMUELBOAKYE/kaaf-noticeboard-backend.git",
      path: "/var/backups/kaaf-noticeboard",

      "post-deploy": "npm install --production && npm run db:backup",

      env: {
        NODE_ENV: "backup",
        BACKUP_MODE: true,
      },
    },
  },

  // Hooks for all apps
  hooks: {
    "pre-start": 'echo "🚀 PM2 is starting applications..."',
    "post-start": 'echo "✅ All applications started"',
    "pre-stop": 'echo "🛑 Stopping all applications..."',
    "post-stop": 'echo "✅ All applications stopped"',
    "pre-restart": 'echo "🔄 Restarting applications..."',
    "post-restart": 'echo "✅ Applications restarted"',
  },

  // Log rotation settings (requires pm2-logrotate)
  logrotate: {
    max_size: "10M",
    retain: 30,
    compress: true,
    dateFormat: "YYYY-MM-DD_HH-mm-ss",
    workerInterval: 30,
    rotateInterval: "0 0 * * *",
    rotateModule: true,
  },

  // Graceful shutdown settings
  graceful_shutdown: {
    timeout: 10000,
    kill_timeout: 5000,
    force: false,
  },

  // Monitoring settings
  monitoring: {
    cpu_interval: 5000,
    memory_interval: 10000,
    alert_threshold: {
      cpu: 80,
      memory: 85,
      restart_rate: 5,
    },
    webhook: process.env.MONITORING_WEBHOOK || null,
  },

  auto_scale: {
    enabled: false,
    min_instances: 2,
    max_instances: 10,
    cpu_threshold: 70,
    memory_threshold: 80,
    check_interval: 30000,
  },
};

// Start all apps: pm2 start ecosystem.config.js
// Start specific app: pm2 start ecosystem.config.js --only kaaf-noticeboard-api
// Stop all: pm2 stop all
// Restart all: pm2 restart all
// Reload all (zero-downtime): pm2 reload all
// Delete all: pm2 delete all
// Monitor: pm2 monit
// Logs: pm2 logs
// Status: pm2 status
// Save current processes: pm2 save
// Setup startup script: pm2 startup
