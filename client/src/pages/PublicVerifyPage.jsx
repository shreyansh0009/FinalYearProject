import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyDocument } from '../api/api.js';
import { useFileHash } from '../hooks/useFileHash.js';

// Import reusable components
import VerifyForm from '../components/VerifyForm.jsx';
import VerificationResult from '../components/VerificationResult.jsx';

export default function PublicVerifyPage() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchParams] = useSearchParams();

  const { calculateHash, isHashing } = useFileHash();

  // Auto-verify if a hash is passed via QR code URL (?hash=xxx)
  useEffect(() => {
    const hashFromUrl = searchParams.get('hash');
    if (hashFromUrl) {
      setIsLoading(true);
      verifyDocument(hashFromUrl)
        .then((response) => {
          setResult({ success: true, message: response.message, data: response.data });
        })
        .catch((error) => {
          const errorMessage = error.response?.data?.message || error.message || 'Verification Failed.';
          setResult({ success: false, message: `❌ ${errorMessage}` });
        })
        .finally(() => setIsLoading(false));
    }
  }, [searchParams]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setResult({ success: false, message: 'Please select a file to verify.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const hash = await calculateHash(file);
      if (!hash) {
        throw new Error('Could not calculate file hash.');
      }

      const response = await verifyDocument(hash);

      setResult({
        success: true,
        message: response.message,
        data: response.data,
      });

    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Verification Failed.';

      setResult({
        success: false,
        message: `❌ ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-end">
          <Link 
            to="/login" 
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Login →
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Document Verification Portal
        </h1>
        <p className="text-center text-gray-600">
          Upload a document to verify its authenticity.
        </p>
        
        <VerifyForm
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          isLoading={isLoading || isHashing}
          fileIsSelected={!!file}
        />
        
        {result && (
          <VerificationResult
            success={result.success}
            message={result.message}
            data={result.data}
          />
        )}
      </div>
    </div>
  );
}