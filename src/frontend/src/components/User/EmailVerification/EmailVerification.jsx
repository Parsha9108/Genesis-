
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import backendApi from '../../../api/backendAxiosInstance';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); 
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await backendApi.get(`/register/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully.');
        toast.success(res.data.message);
        setTimeout(() => navigate('/signin'), 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed.');
        toast.error(error.response?.data?.error || 'Verification failed.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-700 text-lg font-medium">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-semibold text-green-700">Success!</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="text-sm text-gray-400 mt-1">Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-2xl font-semibold text-red-700">Verification Failed</h2>
            <p className="mt-2 text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};


export default EmailVerification; 
  
