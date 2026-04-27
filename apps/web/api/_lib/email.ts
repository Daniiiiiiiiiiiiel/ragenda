import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.EMAIL_FROM ?? 'RaGenda <no-reply@ragenda.app>';
const APP_URL = process.env.VITE_API_URL?.replace('/api', '') ?? 'https://ragenda.app';

// ─── Email Verification ────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your RaGenda account / Verifica tu cuenta de RaGenda',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Inter, sans-serif; background:#f8fafc; margin:0; padding:32px;">
          <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; padding:40px; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="text-align:center; margin-bottom:32px;">
              <span style="font-size:28px; font-weight:800; color:#1e293b;">
                <span style="color:#6366f1;">R</span>a<span style="color:#6366f1;">G</span>enda
              </span>
            </div>
            <h1 style="font-size:22px; font-weight:700; color:#1e293b; margin:0 0 8px;">
              Welcome, ${name}! / ¡Bienvenido/a, ${name}!
            </h1>
            <p style="color:#64748b; font-size:15px; margin:0 0 28px; line-height:1.6;">
              Please verify your email address to activate your account.<br/>
              Por favor, verifica tu correo electrónico para activar tu cuenta.
            </p>
            <a href="${verifyUrl}" style="display:inline-block; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:600; font-size:15px;">
              Verify Email / Verificar correo
            </a>
            <p style="color:#94a3b8; font-size:13px; margin:24px 0 0;">
              Link expires in 24 hours. / El enlace expira en 24 horas.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

// ─── Appointment Status Notification ─────────────────────────────────────────

export async function sendAppointmentStatusEmail(
  to: string,
  name: string,
  status: 'ACCEPTED' | 'REJECTED',
  appointmentDate: string,
  serviceName: string,
  adminNotes?: string,
): Promise<void> {
  const isAccepted = status === 'ACCEPTED';
  const statusEn = isAccepted ? '✅ Confirmed' : '❌ Rejected';
  const statusEs = isAccepted ? '✅ Confirmada' : '❌ Rechazada';
  const color = isAccepted ? '#22c55e' : '#ef4444';

  await resend.emails.send({
    from: FROM,
    to,
    subject: `RaGenda — Appointment ${statusEn} / Cita ${statusEs}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/></head>
        <body style="font-family: Inter, sans-serif; background:#f8fafc; margin:0; padding:32px;">
          <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; padding:40px; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="text-align:center; margin-bottom:32px;">
              <span style="font-size:28px; font-weight:800; color:#1e293b;">
                <span style="color:#6366f1;">R</span>a<span style="color:#6366f1;">G</span>enda
              </span>
            </div>
            <div style="background:${color}15; border-left:4px solid ${color}; border-radius:8px; padding:16px; margin-bottom:24px;">
              <p style="font-size:18px; font-weight:700; color:${color}; margin:0;">
                ${statusEn} / ${statusEs}
              </p>
            </div>
            <p style="color:#475569; font-size:15px; line-height:1.6;">
              Hi ${name} / Hola ${name},<br/><br/>
              Your appointment for <strong>${serviceName}</strong> on <strong>${appointmentDate}</strong> has been <strong>${isAccepted ? 'confirmed' : 'rejected'}</strong>.<br/>
              Tu cita para <strong>${serviceName}</strong> el <strong>${appointmentDate}</strong> ha sido <strong>${isAccepted ? 'confirmada' : 'rechazada'}</strong>.
            </p>
            ${adminNotes ? `<p style="background:#f1f5f9; border-radius:8px; padding:12px; color:#475569; font-size:14px;"><strong>Note / Nota:</strong> ${adminNotes}</p>` : ''}
          </div>
        </body>
      </html>
    `,
  });
}
