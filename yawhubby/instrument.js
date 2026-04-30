const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://4de79bc306cbc02f11e385e2e80285d4@o4511214471938048.ingest.de.sentry.io/4511214486814800",

  sendDefaultPii: true,

  environment: process.env.NODE_ENV || "development",

  release: "yawhubby@1.0.0",

  tracesSampleRate: 1.0,
});

console.log("✅ Sentry initialized");
