import { Resend } from 'resend';

export async function sendFormChangeAlert(
  previousHash: string,
  newHash: string,
  sourceUrl: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const timestamp = new Date().toISOString();

  await resend.emails.send({
    from: 'alerts@permitready.com',
    to: process.env.RESEND_ADMIN_EMAIL!,
    subject: 'ACTION REQUIRED: PermitReady form change detected',
    html: `
      <h2>Form Change Detected — PDF Generation Blocked</h2>
      <p>The SHA-256 hash of an official government form no longer matches
      the stored baseline. PDF generation has been blocked for all affected
      users until this is resolved.</p>

      <table style="border-collapse:collapse;font-family:monospace;font-size:13px;">
        <tr>
          <td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">Source URL</td>
          <td><a href="${sourceUrl}">${sourceUrl}</a></td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">Detected at</td>
          <td>${timestamp}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">Previous hash</td>
          <td style="color:#2D7A2D;">${previousHash}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">New hash</td>
          <td style="color:#C8391A;">${newHash}</td>
        </tr>
      </table>

      <h3>Required actions</h3>
      <ol>
        <li>Download the new form from the source URL above.</li>
        <li>Compare it side-by-side with the current form template in
            <code>public/form-templates/</code>.</li>
        <li>If the form fields have changed, update the field mappings in
            <code>lib/forms/la-county-business-license.ts</code> and the
            PDF template in <code>public/form-templates/</code>.</li>
        <li>Once the template is confirmed correct, update
            <code>form_versions.current_hash</code> to the new hash and
            set <code>status</code> back to <code>verified</code> in the
            Supabase dashboard.</li>
        <li>PDF generation will resume automatically once status is
            <code>verified</code>.</li>
      </ol>

      <p style="color:#888;font-size:12px;">
        This alert was sent by the RestaurantOS LA form currency validator.
        Do not reply to this email.
      </p>
    `,
  });
}
