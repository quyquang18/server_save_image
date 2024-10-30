module.exports = {
  apps: [
    {
      name: "API service server save image",
      script: "./dist/index.js",
      instances: 1, // number process of application
      autorestart: true, //auto restart if app crashes
      watch: false,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production", // Environment variables
      },
    },
  ],
};
