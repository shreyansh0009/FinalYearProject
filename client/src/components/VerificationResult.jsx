import React from 'react';

// A "dumb" component just for displaying the result.
export default function VerificationResult({ success, message, data }) {
  return (
    <>
      {/* Message Area */}
      <div
        className={`p-4 rounded-md text-center font-medium
                   ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
      >
        {message}
      </div>

      {/* Success Details Card */}
      {success && data && (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Verification Details
          </h2>
          <div className="space-y-3">
            <DetailRow label="Document Name" value={data.documentName} />
            {data.ownerName && <DetailRow label="Owner" value={data.ownerName} />}
            {data.department && <DetailRow label="Department" value={data.department} />}
            {data.issuedBy && <DetailRow label="Issued By" value={data.issuedBy} />}
            {data.issuedAt && (
              <DetailRow
                label="Date Issued"
                value={new Date(data.issuedAt).toLocaleString()}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Helper component for displaying details
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}