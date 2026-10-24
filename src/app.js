const express = require('express');
const os = require('os');

const app = express();

// Endpoint principal: dice qué versión y qué pod responde.
// Útil para ver un rolling update en directo (curl en bucle mientras despliegas).
app.get('/', (req, res) => {
  res.json({
    app: 'devops-lab-openshift',
    version: process.env.APP_VERSION || 'dev',
    environment: process.env.APP_ENV || 'local',
    message: process.env.APP_MESSAGE || 'Hola desde OpenShift',
    pod: os.hostname(),
  });
});

// livenessProbe: "¿el proceso está vivo?" Si falla, el kubelet REINICIA el contenedor.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// readinessProbe: "¿puedo recibir tráfico?" Si falla, el pod sale del Service (no se reinicia).
let ready = true;
app.get('/ready', (req, res) => {
  if (!ready) return res.status(503).json({ status: 'NOT_READY' });
  res.status(200).json({ status: 'READY' });
});

app.setReady = (value) => {
  ready = value;
};

module.exports = app;
