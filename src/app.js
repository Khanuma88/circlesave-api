const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');
const { env } = require('./config/env');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/v1', routes);

app.use((req, res) => {
  res.status(404).json({ status: 404, code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);

module.exports = { app };