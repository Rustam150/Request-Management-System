const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const { authenticateToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/register', async (req, res) => {
  const { username, password, fullname, group_name } = req.body;

  if (!username || !password || !fullname || !group_name) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password, fullname, group_name) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, fullname, group_name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
          }
          return res.status(500).json({ error: 'Ошибка при регистрации' });
        }
        
        const token = jwt.sign(
          { id: this.lastID, username },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.status(201).json({ 
          message: 'Регистрация успешна',
          token,
          user: { id: this.lastID, username, fullname, group_name }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        group_name: user.group_name
      }
    });
  });
});

app.get('/api/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, fullname, group_name FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    res.json(user);
  });
});

app.get('/api/requests', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, requests) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при получении заявок' });
      }
      res.json(requests);
    }
  );
});

app.get('/api/requests/:id', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM requests WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, request) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      if (!request) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }
      res.json(request);
    }
  );
});

app.post('/api/requests', authenticateToken, (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Название и описание обязательны' });
  }

  db.run(
    'INSERT INTO requests (user_id, title, description) VALUES (?, ?, ?)',
    [req.user.id, title, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при создании заявки' });
      }
      
      db.get('SELECT * FROM requests WHERE id = ?', [this.lastID], (err, request) => {
        if (err) {
          return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.status(201).json(request);
      });
    }
  );
});

app.put('/api/requests/:id', authenticateToken, (req, res) => {
  const { title, description, status } = req.body;
  const requestId = req.params.id;

  db.get(
    'SELECT * FROM requests WHERE id = ? AND user_id = ?',
    [requestId, req.user.id],
    (err, request) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
      if (!request) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }

      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Нет полей для обновления' });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(requestId, req.user.id);

      const sql = `UPDATE requests SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;

      db.run(sql, updateValues, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при обновлении заявки' });
        }

        db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, updatedRequest) => {
          if (err) {
            return res.status(500).json({ error: 'Ошибка сервера' });
          }
          res.json(updatedRequest);
        });
      });
    }
  );
});

app.delete('/api/requests/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM requests WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при удалении заявки' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }
      res.json({ message: 'Заявка удалена' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}/api`);
});

