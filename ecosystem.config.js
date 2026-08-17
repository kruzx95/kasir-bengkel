// PM2 Ecosystem Configuration — Irian Motor (Staging & Production)
// Jalankan semua: pm2 start ecosystem.config.js
// Jalankan hanya prod: pm2 start ecosystem.config.js --only irian-motor-prod
// Jalankan hanya staging: pm2 start ecosystem.config.js --only irian-motor-staging

module.exports = {
  apps: [
    {
      name: 'irian-motor-prod',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/irian-motor-prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/irian-motor/prod-error.log',
      out_file: '/var/log/irian-motor/prod-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'irian-motor-staging',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/irian-motor-staging',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/irian-motor/staging-error.log',
      out_file: '/var/log/irian-motor/staging-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}

