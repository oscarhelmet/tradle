module.exports = {
  apps: [
    {
      name: 'tradle-backend',
      script: './server.js', // or whatever your main server file is
      cwd: '/vol1/tradle/server',
      env: {
        NODE_ENV: 'production',
        PORT: 5599
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
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
      watch: false
    }
  ]
};
