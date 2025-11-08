import React, { useState } from 'react';
import { verifyDocument } from '../api/api.js';
import { useFileHash } from '../hooks/useFileHash.js';

// Import reusable components
import VerifyForm from '../components/VerifyForm.jsx';
import VerificationResult from '../components/VerificationResult.jsx';

// This is the main "page" component.
// Its job is to manage the state and logic for this page.
export default function PublicVerifyPage() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // Will hold { success, message, data }

  // Custom hook to handle hashing logic
  const { calculateHash, isHashing } = useFileHash();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null); // Reset result when a new file is selected
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
      // 1. Calculate the hash using our custom hook
      const hash = await calculateHash(file);
      if (!hash) {
        throw new Error('Could not calculate file hash.');
      }

      // 2. Send *only* the hash to the backend via our API service
      const response = await verifyDocument(hash);

      // 3. Set the successful result
      setResult({
        success: true,
        message: response.message,
        data: response.data,
      });

    } catch (error) {
      // 4. Set the error result
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