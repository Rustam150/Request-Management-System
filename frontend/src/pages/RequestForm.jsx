import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../utils/api';

function RequestForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'новая'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/requests/${id}`);
      setFormData({
        title: response.data.title,
        description: response.data.description,
        status: response.data.status
      });
    } catch (err) {
      setError('Ошибка загрузки заявки');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/requests/${id}`, formData);
      } else {
        await api.post('/requests', formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при сохранении заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>{isEdit ? 'Редактировать заявку' : 'Создать заявку'}</h1>
        </div>
        <Link to="/dashboard" className="btn-secondary">← Назад</Link>
      </header>

      <div className="dashboard-content">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Название заявки *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Например: Не работает проектор в аудитории 301"
              />
            </div>

            <div className="form-group">
              <label>Описание проблемы *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="6"
                placeholder="Опишите проблему подробно..."
              />
            </div>

            {isEdit && (
              <div className="form-group">
                <label>Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="новая">Новая</option>
                  <option value="в работе">В работе</option>
                  <option value="решена">Решена</option>
                </select>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать заявку')}
              </button>
              <Link to="/dashboard" className="btn-secondary">Отмена</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RequestForm;
