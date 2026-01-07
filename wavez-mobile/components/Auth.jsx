import React, { useState } from 'react';
import { supabase } from '../supabase';
export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // בורר בין מצב התחברות להרשמה

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    const { error } = result;

    if (error) {
      alert(error.message);
    } else if (!isLogin) {
      alert('נרשמת בהצלחה! בדוק את המייל שלך לאימות (אם הגדרת את זה) או התחבר.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.header}>WAVEZ PRO</h1>
        <p style={styles.subHeader}>{isLogin ? 'התחבר למערכת' : 'צור משתמש חדש'}</p>
        
        <form onSubmit={handleAuth} style={styles.form}>
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'טוען...' : (isLogin ? 'כניסה' : 'הרשמה')}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLogin ? 'אין לך עדיין משתמש?' : 'כבר רשום?'}
          <span onClick={() => setIsLogin(!isLogin)} style={styles.link}>
            {isLogin ? ' הירשם כאן' : ' התחבר כאן'}
          </span>
        </p>
      </div>
    </div>
  );
}

// עיצוב בסיסי ונקי (אפשר להחליף ב-CSS רגיל אם אתה מעדיף)
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8' },
  card: { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  header: { color: '#0070f3', marginBottom: '0.5rem' },
  subHeader: { color: '#666', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '1rem' },
  button: { padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#0070f3', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  toggleText: { marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' },
  link: { color: '#0070f3', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' },
};