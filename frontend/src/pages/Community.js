import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from '../hooks/useTranslation';

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState({});

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/posts');
      setPosts(data.posts);
    } catch (err) {
      setPosts([]);
      toast.error(t('communityFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const formData = new FormData();
      formData.append('text', text);
      if (image) formData.append('image', image);
      await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setText('');
      setImage(null);
      fetchPosts();
    } catch (err) {
      toast.error(t('createPostFailed'));
    }
  };

  const handleLike = async (id) => {
    try {
      await api.put(`/posts/${id}/like`);
      fetchPosts();
    } catch (err) {
      toast.error(t('updateLikeFailed'));
    }
  };

  const handleComment = async (id) => {
    const commentText = commentDrafts[id];
    if (!commentText?.trim()) return;
    try {
      await api.post(`/posts/${id}/comment`, { text: commentText });
      setCommentDrafts({ ...commentDrafts, [id]: '' });
      fetchPosts();
    } catch (err) {
      toast.error(t('addCommentFailed'));
    }
  };

  return (
    <div>
      <div className="glass-card p-4 mb-3">
        <h5 className="section-title mb-3"><i className="bi bi-people me-2"></i>{t('farmerCommunity')}</h5>
        <form onSubmit={handlePost}>
          <textarea className="form-control mb-2" rows={2} placeholder={t('shareWithFarmers')}
            value={text} onChange={(e) => setText(e.target.value)} />
          <div className="d-flex justify-content-between align-items-center">
            <input type="file" accept="image/*" className="form-control w-auto" onChange={(e) => setImage(e.target.files[0])} />
            <button className="btn btn-agri" type="submit">{t('post')}</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : posts.length === 0 ? (
        <div className="glass-card p-5 text-center text-muted">{t('noPosts')}</div>
      ) : (
        posts.map((post) => (
          <div className="glass-card p-4 mb-3" key={post._id}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-person-circle fs-4"></i>
              <div>
                <div className="fw-semibold">{post.user?.fullName}</div>
                <div className="text-muted small">{post.user?.village}</div>
              </div>
            </div>
            <p>{post.text}</p>
            {post.image && <img src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${post.image}`} alt="post" className="img-fluid rounded-3 mb-2" style={{ maxHeight: 300 }} />}
            <div className="d-flex gap-3 small text-muted mb-2">
              <button className="btn btn-sm btn-light" onClick={() => handleLike(post._id)}>
                <i className={`bi ${post.likes.includes(user?._id) ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i> {post.likes.length}
              </button>
              <span><i className="bi bi-chat"></i> {post.comments.length} {t('comments')}</span>
            </div>
            {post.comments.map((c) => (
              <div key={c._id} className="small border-top pt-2 mt-1">
                <strong>{c.user?.fullName}:</strong> {c.text}
              </div>
            ))}
            <div className="input-group mt-2">
              <input className="form-control form-control-sm" placeholder={t('writeComment')}
                value={commentDrafts[post._id] || ''}
                onChange={(e) => setCommentDrafts({ ...commentDrafts, [post._id]: e.target.value })} />
              <button className="btn btn-sm btn-agri-outline" onClick={() => handleComment(post._id)}>{t('send')}</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Community;
