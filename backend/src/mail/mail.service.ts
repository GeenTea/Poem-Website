import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

export interface MailMessage {
    to: string;
    subject: string;
    text: string;
    html: string;
}

/**
 * Отправка писем через SMTP (nodemailer). Настройки — в backend/.env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM (необязательно SMTP_SECURE=true для порта 465)
 * Если SMTP_HOST не задан (разработка) — письмо не отправляется, а печатается в консоль бэкенда.
 */
@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: Transporter | null;
    private readonly from = process.env.MAIL_FROM ?? 'Poem Nest <no-reply@poemnest.local>';

    constructor() {
        const host = process.env.SMTP_HOST;
        this.transporter = host
            ? nodemailer.createTransport({
                  host,
                  port: Number(process.env.SMTP_PORT ?? 587),
                  secure: process.env.SMTP_SECURE === 'true', // true для 465, false для 587 (STARTTLS)
                  auth: process.env.SMTP_USER
                      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                      : undefined,
              })
            : null;

        if (!this.transporter) {
            this.logger.warn('SMTP is not configured (SMTP_HOST is empty) — emails will be printed to the console');
        }
    }

    async send(message: MailMessage) {
        if (!this.transporter) {
            this.logger.log(
                `\n----- EMAIL (not sent, SMTP not configured) -----\n` +
                    `To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n` +
                    `--------------------------------------------------`,
            );
            return;
        }

        await this.transporter.sendMail({ from: this.from, ...message });
    }
}
