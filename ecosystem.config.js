// PM2 Ecosystem Configuration — Irian Motor
// Jalankan: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'irian-motor',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/irian-motor',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Log configuration
      error_file: '/var/log/irian-motor/error.log',
      out_file: '/var/log/irian-motor/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
