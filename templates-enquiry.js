export const enquiryReceivedTemplate = (name) => `
<div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 2px solid #e9ecef;">
      <img src="https://via.placeholder.com/150x50?text=Kesula+Trust" alt="Kesula Charitable Trust" style="max-height: 50px;" />
    </div>
    <div style="padding: 30px 20px; background-color: #ffffff;">
      <h2 style="color: #2c3e50; margin-top: 0;">Enquiry Received</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for getting in touch with Kesula Charitable Trust!</p>
      <p>We have successfully received your message and our team will review it and get back to you as soon as possible.</p>
      <br/>
      <p>Warm regards,</p>
      <p><strong>Kesula Charitable Trust Team</strong></p>
    </div>
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
      <p>&copy; ${new Date().getFullYear()} Kesula Charitable Trust. All rights reserved.</p>
    </div>
  </div>
</div>
`;
