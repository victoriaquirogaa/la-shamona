import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, doc, setDoc } from 'firebase/firestore';

interface Comment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: any;
}

interface Props {
  onClose: () => void;
  bebidaId?: string;
}

const CommentsOverlay: React.FC<Props> = ({ onClose, bebidaId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar comentarios desde Firestore
  useEffect(() => {
    const cargarComentarios = async () => {
      if (!bebidaId) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, `bebidas/${bebidaId}/comentarios`),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const comentariosData: Comment[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          comentariosData.push({
            id: doc.id,
            userName: data.userName || 'Anónimo',
            userAvatar: data.userAvatar,
            text: data.text,
            timestamp: data.timestamp
          });
        });

        console.log(`Bebida ${bebidaId} tiene ${comentariosData.length} comentarios reales`);
        setComments(comentariosData);
      } catch (error) {
        console.error('Error cargando comentarios:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    cargarComentarios();
  }, [bebidaId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user?.uid || !bebidaId || submitting) {
      console.warn('Validación falló:', { hasComment: !!newComment.trim(), hasUser: !!user?.uid, hasBebidaId: !!bebidaId });
      return;
    }

    setSubmitting(true);
    try {
      const commentRef = collection(db, `bebidas/${bebidaId}/comentarios`);
      
      const docRef = await addDoc(commentRef, {
        userName: user.nombre || 'Usuario',
        userAvatar: user.avatar || null,
        text: newComment,
        userId: user.uid,
        timestamp: serverTimestamp()
      });

      console.log('Comentario agregado:', docRef.id);
      setNewComment('');
      
      // Recargar comentarios para contar los reales
      const qCount = query(
        collection(db, `bebidas/${bebidaId}/comentarios`),
        orderBy('timestamp', 'desc')
      );
      const snapshotCount = await getDocs(qCount);
      const realCount = snapshotCount.size;
      
      // Actualizar el contador de comentarios en la bebida con el número real
      const bebidaRef = doc(db, 'bebidas', bebidaId);
      await setDoc(bebidaRef, { comments: realCount }, { merge: true });
      
      // Recargar comentarios
      const qReload = query(
        collection(db, `bebidas/${bebidaId}/comentarios`),
        orderBy('timestamp', 'desc')
      );
      const snapshotReload = await getDocs(qReload);
      const comentariosData: Comment[] = [];
      
      snapshotReload.forEach((doc) => {
        const data = doc.data();
        comentariosData.push({
          id: doc.id,
          userName: data.userName || 'Anónimo',
          userAvatar: data.userAvatar,
          text: data.text,
          timestamp: data.timestamp
        });
      });

      setComments(comentariosData);
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      alert('Error al enviar comentario: ' + (error instanceof Error ? error.message : 'Desconocido'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md bg-[#020617] text-white rounded-t-3xl p-6 safe-bottom border-t border-white/10 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Comentarios ({comments.length})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* Área de comentarios */}
        <div className="flex-1 overflow-y-auto no-scrollbar mb-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-slate-500 text-sm">Cargando comentarios...</p>
            </div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {comment.userAvatar ? (
                    <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-xs">person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{comment.userName}</p>
                    <span className="text-xs text-slate-500">
                      {comment.timestamp?.toDate?.().toLocaleDateString?.() || 'ahora'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 break-words mt-1">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <span className="material-icons-round text-4xl block mb-2 opacity-30">chat_bubble_outline</span>
              <p className="text-sm">Aún no hay comentarios. ¡Sé el primero!</p>
            </div>
          )}
        </div>

        {/* Input para escribir comentario */}
        {user?.uid ? (
          <div className="flex gap-2 pt-4 border-t border-white/10">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="Escribe un comentario..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
              disabled={submitting}
            />
            <button 
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white flex items-center justify-center transition-colors"
            >
              <span className="material-icons-round text-xl">send</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-2xl text-center text-sm text-slate-300">
            Inicia sesión para comentar
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsOverlay;
