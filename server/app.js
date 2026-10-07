import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

import db from './db.js'


app.get('/api/health', (req, res) => {

  db.get('SELECT 1', [], (err, row) => {
    
  if(err){
      return res.status(500).json({status:'Error', message: 'Database connection failed'})
    }
  
  res.json({status:'OK', message: 'Server & database running smoothly'})

  })

})

export default app;