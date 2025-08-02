// Using basic email composition for now
// Can be enhanced with nodemailer when email packages are available

interface EmailConfig {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface PreBidQuery {
  Question: string;
  Section?: string;
  Justification?: string;
}

class EmailService {
  constructor() {
    // Email service configuration
  }

  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      console.log('Email would be sent to:', config.to);
      console.log('Subject:', config.subject);
      console.log('Email functionality prepared for future integration');
      
      // For now, return true to indicate email is prepared
      // This can be enhanced with actual email sending when packages are available
      return true;
    } catch (error) {
      console.error('Email preparation failed:', error);
      return false;
    }
  }

  generatePreBidQueryEmail(
    queries: PreBidQuery[],
    tenderTitle: string,
    tenderReference?: string,
    companyName: string = 'Appentus Technologies'
  ): { subject: string; html: string; text: string } {
    const subject = `Pre-bid Queries - ${tenderTitle}${tenderReference ? ` (Ref: ${tenderReference})` : ''}`;
    
    const text = `Dear Sir/Madam,

We are writing to seek clarifications regarding the tender: ${tenderTitle}${tenderReference ? ` (Reference: ${tenderReference})` : ''}

We have the following queries:

${queries.map((query, index) => `${index + 1}. ${query.Question}${query.Section ? ` (Section: ${query.Section})` : ''}${query.Justification ? `\n   Justification: ${query.Justification}` : ''}`).join('\n\n')}

We request you to kindly clarify these points at your earliest convenience to enable us to submit a comprehensive and compliant bid.

Thank you for your attention to this matter.

Best regards,
${companyName}
Tender Team`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        Pre-bid Queries
      </h2>
      
      <p><strong>Tender:</strong> ${tenderTitle}</p>
      ${tenderReference ? `<p><strong>Reference:</strong> ${tenderReference}</p>` : ''}
      
      <p>Dear Sir/Madam,</p>
      
      <p>We are writing to seek clarifications regarding the above-mentioned tender. We have the following queries:</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${queries.map((query, index) => `
          <div style="margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 6px; border-left: 4px solid #2563eb;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">Query #${index + 1}${query.Section ? ` - ${query.Section}` : ''}</h4>
            <p style="margin: 0 0 10px 0; font-weight: 500;">${query.Question}</p>
            ${query.Justification ? `<p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">Justification: ${query.Justification}</p>` : ''}
          </div>
        `).join('')}
      </div>
      
      <p>We request you to kindly clarify these points at your earliest convenience to enable us to submit a comprehensive and compliant bid.</p>
      
      <p>Thank you for your attention to this matter.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;"><strong>Best regards,</strong></p>
        <p style="margin: 5px 0 0 0; color: #2563eb; font-weight: 600;">${companyName}</p>
        <p style="margin: 0; color: #6b7280;">Tender Team</p>
      </div>
    </div>`;

    return { subject, html, text };
  }

  async sendPreBidQueries(
    queries: PreBidQuery[],
    recipientEmails: string[],
    tenderTitle: string,
    tenderReference?: string,
    senderEmail: string = 'tenders@appentus.com',
    companyName: string = 'Appentus Technologies'
  ): Promise<boolean> {
    const emailContent = this.generatePreBidQueryEmail(queries, tenderTitle, tenderReference, companyName);
    
    return await this.sendEmail({
      from: senderEmail,
      to: recipientEmails,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });
  }
}

export const emailService = new EmailService();