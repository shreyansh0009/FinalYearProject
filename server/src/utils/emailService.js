import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendDocumentIssuedEmail = async ({ toEmail, studentName, documentName, issuedBy, department, verifyUrl }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured. Skipping email notification.");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Document Verification System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your document has been issued: ${documentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Document Issued Successfully</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #374151; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
          <p style="color: #374151;">Your document has been reviewed and officially issued on the blockchain.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px; color: #374151;"><strong>Document:</strong> ${documentName}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Department:</strong> ${department}</p>
            <p style="margin: 0; color: #374151;"><strong>Issued by:</strong> ${issuedBy}</p>
          </div>
          <p style="color: #374151;">You can verify this document at any time using the link below:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyUrl}" style="background: #16a34a; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">Verify Document</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendDocumentRejectedEmail = async ({ toEmail, studentName, documentName, rejectionReason }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured. Skipping email notification.");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Document Verification System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your document needs attention: ${documentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Document Rejected</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #374151; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
          <p style="color: #374151;">Unfortunately, your document could not be approved at this time.</p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px; color: #374151;"><strong>Document:</strong> ${documentName}</p>
            <p style="margin: 0; color: #374151;"><strong>Reason:</strong> ${rejectionReason}</p>
          </div>
          <p style="color: #374151;">Please address the issue mentioned above and re-upload your document through the student portal.</p>
          <p style="color: #6b7280; font-size: 13px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendStudentRegisteredEmail = async ({ toEmail, studentName, username, password, departmentName, registeredByName }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured. Skipping email notification.");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Document Verification System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your account has been created — Document Verification System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to the Document Verification System</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #374151; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
          <p style="color: #374151;">Your student account has been created by <strong>${registeredByName}</strong>. You can now log in and upload your documents for verification.</p>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px; color: #374151;"><strong>Department:</strong> ${departmentName}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 0; color: #374151;"><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #dc2626; font-size: 13px;"><strong>Important:</strong> Please change your password after your first login.</p>
          <p style="color: #6b7280; font-size: 13px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  });
};
