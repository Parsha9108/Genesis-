import  { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './Contexts/AuthContext';


const PrivateRoute = ({ children }) => {
  const {
    authenticated,
    setAuthenticated,
    user,
    setUser,
    loading,
    setLoading
  } = useAuth();

  useEffect(() => {
    setLoading(true);
    axios.get('/api/webuser/dashboard/', { withCredentials: true })
      .then(res => {
        if (res.status === 200) {
           console.log("Checking authentication status...",res)
          setAuthenticated(true);
          setUser(res.data.user); 
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      })
      .catch(() => {
        setAuthenticated(false);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return authenticated ? children : <Navigate to="/signin" />;
};

export default PrivateRoute;
