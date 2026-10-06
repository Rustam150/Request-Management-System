import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser, logout } from '../utils/auth';

function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/requests');
      setRequests(response.data);
    } catch (err) {
      setError('Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить заявку?')) return;

    try {
      await api.delete(`/requests/${id}`);
      setRequests(requests.filter(req => req.id !== id));
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Мои заявки</h1>
          <p className="user-info">{user?.fullname} · {user?.group_name}</p>
        </div>
        <div className="header-actions">
          <Link to="/requests/new" className="btn-primary">+ Создать заявку</Link>
          <button onClick={logout} className="btn-secondary">Выход</button>
        </div>
      </header>

      <div className="dashboard-content">
        {loading && <div className="loading">Загрузка...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && requests.length === 0 && (
          <div className="empty-state">
            <p>У вас пока нет заявок</p>
            <Link to="/requests/new" className="btn-primary">Создать первую заявку</Link>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="requests-grid">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.title}</h3>
                  <span className={`status-badge ${getStatusClass(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                
                <p className="request-description">
                  {request.description.length > 100 
                    ? `${request.description.substring(0, 100)}...` 
                    : request.description}
                </p>
                
                <div className="request-footer">
                  <span className="request-date">
                    {new Date(request.created_at).toLocaleDateString('ru-RU')}
                  </span>
                  <div className="request-actions">
                    <Link to={`/requests/${request.id}`} className="btn-small">Открыть</Link>
                    <Link to={`/requests/${request.id}/edit`} className="btn-small">Изменить</Link>
                    <button 
                      onClick={() => handleDelete(request.id)} 
                      className="btn-small btn-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
