import type { MailMessage } from './mail.service';

// Простые письма: текстовая версия (для почтовиков без HTML) + HTML в цветах сайта.
// HTML-письма верстают таблицами и инлайн-стилями — почтовые клиенты плохо понимают современный CSS.

const COLORS = { cream: '#fff7eb', ink: '#2f3122', muted: '#5f6349', berry: '#cc3a63', border: '#e8dfcc' };

function layout(title: string, body: string) {
    return `<!doctype html><html><body style="margin:0;background:${COLORS.cream};font-family:Georgia,serif;color:${COLORS.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${COLORS.border};border-radius:20px;padding:32px">
<tr><td>
<p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted};font-family:Arial,sans-serif">Poem Nest</p>
<h1 style="margin:0 0 20px;font-size:26px;font-weight:normal">${title}</h1>
${body}
</td></tr></table>
</td></tr></table></body></html>`;
}

export function resetCodeEmail(to: string, name: string, code: string, minutes: number): MailMessage {
    return {
        to,
        subject: `${code} is your Poem Nest password reset code`,
        text:
            `Hi ${name},\n\nYour password reset code is: ${code}\n\n` +
            `It expires in ${minutes} minutes. If you didn't ask to reset your password, you can ignore this email — your password won't change.`,
        html: layout(
            'Reset your password',
            `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${escapeHtml(name)}, use this code to reset your password:</p>
<p style="margin:0 0 16px;font-size:34px;letter-spacing:10px;font-family:'Courier New',monospace;color:${COLORS.berry}">${code}</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.muted}">It expires in ${minutes} minutes. If you didn't ask to reset your password, ignore this email — your password won't change.</p>`,
        ),
    };
}

export function passwordChangedEmail(to: string, name: string, when: Date): MailMessage {
    const time = when.toUTCString();
    return {
        to,
        subject: 'Your Poem Nest password was changed',
        text:
            `Hi ${name},\n\nThe password for your Poem Nest account was changed on ${time}.\n\n` +
            `If this was you, no action is needed. If it wasn't, reset your password right away and contact us.`,
        html: layout(
            'Your password was changed',
            `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${escapeHtml(name)}, the password for your account was changed on <b>${time}</b>.</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.muted}">If this was you, no action is needed. If it wasn't, reset your password right away — all other sessions have already been signed out.</p>`,
        ),
    };
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function emailChangeCodeEmail(to: string, name: string, code: string, minutes: number): MailMessage {
    return {
        to,
        subject: `${code} is your Poem Nest email change code`,
        text:
            `Hi ${name},\n\nYour code to change the email address of your account is: ${code}\n\n` +
            `It expires in ${minutes} minutes. If you didn't ask for this, someone may know your password — change it now.`,
        html: layout(
            'Change your email',
            `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${escapeHtml(name)}, use this code to confirm it's you and change your email address:</p>
<p style="margin:0 0 16px;font-size:34px;letter-spacing:10px;font-family:'Courier New',monospace;color:${COLORS.berry}">${code}</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.muted}">It expires in ${minutes} minutes. If you didn't ask for this, someone may know your password — change it right away.</p>`,
        ),
    };
}

/** Уходит на СТАРУЮ почту: владелец узнает, если адрес сменил кто-то другой */
export function emailChangedEmail(to: string, name: string, newEmailMasked: string, when: Date): MailMessage {
    const time = when.toUTCString();
    return {
        to,
        subject: 'Your Poem Nest email was changed',
        text:
            `Hi ${name},\n\nThe email address of your Poem Nest account was changed to ${newEmailMasked} on ${time}.\n\n` +
            `If this wasn't you, contact us right away.`,
        html: layout(
            'Your email was changed',
            `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${escapeHtml(name)}, the email address of your account was changed to <b>${escapeHtml(newEmailMasked)}</b> on <b>${time}</b>.</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.muted}">This address will no longer receive messages for the account. If this wasn't you, contact us right away — all other sessions have been signed out.</p>`,
        ),
    };
}
