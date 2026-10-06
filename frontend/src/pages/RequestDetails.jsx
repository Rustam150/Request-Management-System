import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function RequestDetails() {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/requests/${id}`);
      setRequest(response.data);
    } catch (err) {
      setError('Ошибка загрузки заявки');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить эту заявку?')) return;

    try {
      await api.delete(`/requests/${id}`);
      navigate('/dashboard');
    } catch (err) {
      alert('Ошибка при удалении заявки');
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'новая': return 'status-new';
      case 'в работе': return 'status-progress';
      case 'решена': return 'status-done';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="dashboard">
        <div className="error-message">{error || 'Заявка не найдена'}</div>
        <Link to="/dashboard" className="btn-secondary">← Назад</Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Заявка #{request.id}</h1>
        </div>
        <div className="header-actions">
          <Link to={`/requests/${id}/edit`} className="btn-primary">Редактировать</Link>
          <button onClick={handleDelete} className="btn-danger">Удалить</button>
          <Link to="/dashboard" className="btn-secondary">← Назад</Link>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="request-details">
          <div className="detail-section">
            <label>Статус</label>
            <span className={`status-badge ${getStatusClass(request.status)}`}>
              {request.status}
            </span>
          </div>

          <div className="detail-section">
            <label>Название</label>
            <h2>{request.title}</h2>
          </div>

          <div className="detail-section">
            <label>Описание</label>
            <p className="description-text">{request.description}</p>
          </div>

          <div className="detail-section">
            <label>Дата создания</label>
            <p>{new Date(request.created_at).toLocaleString('ru-RU')}</p>
          </div>

          <div className="detail-section">
            <label>Последнее обновление</label>
            <p>{new Date(request.updated_at).toLocaleString('ru-RU')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestDetails;
