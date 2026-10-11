/**
 * PM2 Ecosystem Configuration for Hostinger VPS KVM 2
 * Hardware: 2 vCPU cores, 8 GB RAM
 */
module.exports = {
  apps: [
    {
      name: 'apexbuild-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 2, // 1 process per vCPU core on KVM 2
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '1G',
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      watch: false
    }
  ]
};
