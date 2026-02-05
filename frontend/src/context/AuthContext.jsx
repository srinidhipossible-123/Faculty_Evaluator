import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then((data) => {
        setUser({ id: data._id, uid: data._id });
        setUserData({
          _id: data._id,
          uid: data._id,
          name: data.name,
          email: data.email,
          employeeId: data.employeeId,
          designation: data.designation,
          department: data.department,
          batch: data.batch,
          role: data.role,
          quizAttempted: data.quizAttempted,
        });
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setUserData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, user) => {
    if (!token || !user) return;
    const id = user._id != null ? String(user._id) : user.uid;
    localStorage.setItem('token', token);
    setUser({ id, uid: id });
    setUserData({
      _id: id,
      uid: id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      designation: user.designation,
      department: user.department,
      batch: user.batch,
      role: user.role,
      quizAttempted: user.quizAttempted,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUserData(null);
  };

  const value = { user, userData, loading, login, logout };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size={48} className="mb-4" />
          <p className="text-gray-500 font-medium">Loading Application...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
