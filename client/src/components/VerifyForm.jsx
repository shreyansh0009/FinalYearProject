import React from 'react';

// This component is only responsible for the form.
// It is "dumb" and just receives props from its parent page.
export default function verifyForm({ onFileChange, onSubmit, isLoading, fileIsSelected }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Select Document
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={onFileChange}
          className="mt-1 block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100
                     cursor-pointer"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !fileIsSelected}
        className="w-full py-3 px-4 rounded-md text-white font-semibold
                   bg-indigo-600 hover:bg-indigo-700
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verifying...' : 'Verify Document'}
      </button>
    </form>
  );
}