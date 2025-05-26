module.exports = {
  apps: [
    {
      name: 'tradle-backend',
      script: './server.js',
      cwd: '/vol1/tradle/server',
      env: {
        NODE_ENV: 'production',
        PORT: 5599
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/vol1/tradle/logs/backend-error.log',
      out_file: '/vol1/tradle/logs/backend-out.log',
      log_file: '/vol1/tradle/logs/backend-combined.log',
    },
    {
      name: 'tradle-frontend',
      script: 'serve -s build -l 5598',
      interpreter: 'none',
      cwd: '/vol1/tradle',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      error_file: '/vol1/tradle/logs/frontend-error.log',
      out_file: '/vol1/tradle/logs/frontend-out.log',
      log_file: '/vol1/tradle/logs/frontend-combined.log',
    }
  ]
};