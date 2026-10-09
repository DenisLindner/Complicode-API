import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');

    this.from = config.getOrThrow<string>('MAIL_FROM');
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.getOrThrow<number>('SMTP_PORT'),
      secure: config.get<boolean>('SMTP_SECURE'),
      auth: user
        ? { user, pass: config.get<string>('SMTP_PASSWORD') }
        : undefined,
    });
  }

  async sendVerificationCode(to: string, name: string, code: string) {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `${code} é o seu código de verificação do Complicode`,
      text: `Olá, ${name}!\n\nSeu código de verificação é ${code}. Ele expira em 10 minutos.\n\nSe você não solicitou este código, ignore este email.`,
      html: `<p>Olá, ${this.escape(name)}!</p>
<p>Seu código de verificação é:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>Ele expira em 10 minutos.</p>
<p style="color:#666">Se você não solicitou este código, ignore este email.</p>`,
    });
  }

  private escape(value: string) {
    return value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char]!,
    );
  }
}
