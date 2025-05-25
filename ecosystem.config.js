module.exports = {
  apps: [
    {
      name: 'tradle-backend',
      script: './server.js',
      cwd: '/vol1/tradle/server',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/vol1/tradle/logs/backend-error.log',
      out_file: '/vol1/tradle/logs/backend-out.log',
      log_file: '/vol1/tradle/logs/backend-combined.log',
    },
    {
      name: 'tradle-frontend',
      script: 'serve',
      args: '-s build -l 5598',
      cwd: '/vol1/tradle',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: '/vol1/tradle/logs/frontend-error.log',
      out_file: '/vol1/tradle/logs/frontend-out.log',
      log_file: '/vol1/tradle/logs/frontend-combined.log',
    }
  ]
};
