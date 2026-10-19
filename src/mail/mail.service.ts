import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { DEFAULT_LOCALE, Locale } from '../i18n/locale';
import { CODE_TTL_MS } from '../verification/verification.constants';
import { VERIFICATION_MAIL } from './mail.messages';

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

  async sendVerificationCode(
    to: string,
    name: string,
    code: string,
    locale: Locale = DEFAULT_LOCALE,
  ) {
    const mail = VERIFICATION_MAIL[locale];
    const minutes = CODE_TTL_MS / 60_000;

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: mail.subject(code),
      text: `${mail.greeting(name)}

${mail.codeIntro} ${code}. ${mail.expires(minutes)}

${mail.ignore}`,
      html: `<p>${mail.greeting(this.escape(name))}</p>
<p>${mail.codeIntro}</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
<p>${mail.expires(minutes)}</p>
<p style="color:#666">${mail.ignore}</p>`,
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
