import express, { Application } from 'express';
import routes from './src/Routes/index';

import setupSwagger from './utils/swagger.js';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();


const app: Application = express();

app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:4000', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002','http://localhost:3003'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

setupSwagger(app);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes principales
app.use('/api', routes);



const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
