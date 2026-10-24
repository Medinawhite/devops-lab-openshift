const app = require('./app');

// OpenShift no deja escuchar en puertos < 1024 sin privilegios: usamos 8080.
const PORT = Number(process.env.PORT) || 8080;

const server = app.listen(PORT, () => {
  console.log(`devops-lab-openshift escuchando en el puerto ${PORT} (version=${process.env.APP_VERSION || 'dev'})`);
});

// Graceful shutdown: en un rolling update OpenShift manda SIGTERM al pod viejo.
// Dejamos de estar "ready", terminamos las peticiones en curso y salimos.
function shutdown(signal) {
  console.log(`${signal} recibido, cerrando conexiones...`);
  app.setReady(false);
  server.close(() => {
    console.log('Servidor cerrado limpiamente');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
