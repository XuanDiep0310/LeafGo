using LeafGo.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly bool _enableSsl;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            _smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            _smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            _smtpUsername = _configuration["Email:SmtpUsername"] ?? "";
            _smtpPassword = _configuration["Email:SmtpPassword"] ?? "";
            _fromEmail = _configuration["Email:FromEmail"] ?? "noreply@leafgo.com";
            _fromName = _configuration["Email:FromName"] ?? "LeafGo";
            _enableSsl = bool.Parse(_configuration["Email:EnableSsl"] ?? "true");
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
        {
            try
            {
                var resetUrl = $"{_configuration["App:FrontendUrl"]}/reset-password?token={resetToken}";
                var subject = "Reset Your LeafGo Password";
                var body = GetPasswordResetEmailTemplate(resetUrl);

                await SendEmailAsync(toEmail, subject, body);

                _logger.LogInformation("Password reset email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string userName)
        {
            try
            {
                var subject = "Welcome to LeafGo!";
                var body = GetWelcomeEmailTemplate(userName);

                await SendEmailAsync(toEmail, subject, body);

                _logger.LogInformation("Welcome email sent to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", toEmail);
                // Don't throw - welcome email is not critical
            }
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            // If SMTP credentials not configured, just log
            if (string.IsNullOrEmpty(_smtpUsername) || string.IsNullOrEmpty(_smtpPassword))
            {
                _logger.LogWarning("SMTP not configured. Email would be sent to: {Email}, Subject: {Subject}", toEmail, subject);
                return;
            }

            using var message = new MailMessage();
            message.From = new MailAddress(_fromEmail, _fromName);
            message.To.Add(new MailAddress(toEmail));
            message.Subject = subject;
            message.Body = htmlBody;
            message.IsBodyHtml = true;

            using var smtpClient = new SmtpClient(_smtpHost, _smtpPort);
            smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);
            smtpClient.EnableSsl = _enableSsl;

            await smtpClient.SendMailAsync(message);
        }

        private string GetWelcomeEmailTemplate(string userName)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=""utf-8"">
                <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                <title>Welcome to LeafGo</title>
            </head>
            <body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;"">
                <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
                    <tr>
                        <td align=""center"" style=""padding: 40px 0;"">
                            <table role=""presentation"" style=""width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"">
                                <!-- Header -->
                                <tr>
                                    <td style=""background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;"">
                                        <h1 style=""margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;"">
                                            🍃 Welcome to LeafGo!
                                        </h1>
                                    </td>
                                </tr>
                    
                                <!-- Content -->
                                <tr>
                                    <td style=""padding: 40px 30px;"">
                                        <h2 style=""margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;"">
                                            Xin chào {userName}!
                                        </h2>
                                        <p style=""margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.6;"">
                                            Cảm ơn bạn đã đăng ký tài khoản LeafGo - nền tảng đặt xe công nghệ hiện đại và tiện lợi.
                                        </p>
                                        <p style=""margin: 0 0 25px 0; color: #666666; font-size: 16px; line-height: 1.6;"">
                                            Bạn có thể bắt đầu đặt xe ngay bây giờ hoặc khám phá các tính năng của chúng tôi:
                                        </p>
                            
                                        <!-- Features -->
                                        <table role=""presentation"" style=""width: 100%; border-collapse: collapse; margin-bottom: 25px;"">
                                            <tr>
                                                <td style=""padding: 15px; background-color: #f8f9fa; border-radius: 6px; margin-bottom: 10px;"">
                                                    <div style=""display: flex; align-items: center;"">
                                                        <span style=""font-size: 24px; margin-right: 12px;"">🚗</span>
                                                        <div>
                                                            <strong style=""color: #333333; font-size: 16px; display: block; margin-bottom: 4px;"">Đặt xe dễ dàng</strong>
                                                            <span style=""color: #666666; font-size: 14px;"">Chỉ vài thao tác để đặt xe ngay lập tức</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""height: 10px;""></td>
                                            </tr>
                                            <tr>
                                                <td style=""padding: 15px; background-color: #f8f9fa; border-radius: 6px; margin-bottom: 10px;"">
                                                    <div style=""display: flex; align-items: center;"">
                                                        <span style=""font-size: 24px; margin-right: 12px;"">💰</span>
                                                        <div>
                                                            <strong style=""color: #333333; font-size: 16px; display: block; margin-bottom: 4px;"">Giá cả minh bạch</strong>
                                                            <span style=""color: #666666; font-size: 14px;"">Xem trước chi phí trước khi đặt xe</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""height: 10px;""></td>
                                            </tr>
                                            <tr>
                                                <td style=""padding: 15px; background-color: #f8f9fa; border-radius: 6px;"">
                                                    <div style=""display: flex; align-items: center;"">
                                                        <span style=""font-size: 24px; margin-right: 12px;"">⭐</span>
                                                        <div>
                                                            <strong style=""color: #333333; font-size: 16px; display: block; margin-bottom: 4px;"">Tài xế chuyên nghiệp</strong>
                                                            <span style=""color: #666666; font-size: 14px;"">Được đánh giá cao bởi người dùng</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                            
                                        <!-- CTA Button -->
                                        <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
                                            <tr>
                                                <td align=""center"" style=""padding: 20px 0;"">
                                                    <a href=""{_configuration["App:FrontendUrl"]}"" style=""display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;"">
                                                        Bắt đầu đặt xe
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                            
                                        <p style=""margin: 25px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;"">
                                            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email 
                                            <a href=""mailto:support@leafgo.com"" style=""color: #667eea; text-decoration: none;"">support@leafgo.com</a>
                                        </p>
                                    </td>
                                </tr>
                    
                                <!-- Footer -->
                                <tr>
                                    <td style=""background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;"">
                                        <p style=""margin: 0 0 10px 0; color: #999999; font-size: 14px;"">
                                            © 2025 LeafGo. All rights reserved.
                                        </p>
                                        <p style=""margin: 0; color: #999999; font-size: 12px;"">
                                            Bạn nhận được email này vì đã đăng ký tài khoản LeafGo
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>";
        }

        private string GetPasswordResetEmailTemplate(string resetUrl)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset=""utf-8"">
                <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                <title>Reset Your Password</title>
            </head>
            <body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;"">
                <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
                    <tr>
                        <td align=""center"" style=""padding: 40px 0;"">
                            <table role=""presentation"" style=""width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"">
                                <!-- Header -->
                                <tr>
                                    <td style=""background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;"">
                                        <h1 style=""margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;"">
                                            🔐 Reset Your Password
                                        </h1>
                                    </td>
                                </tr>
                    
                                <!-- Content -->
                                <tr>
                                    <td style=""padding: 40px 30px;"">
                                        <h2 style=""margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;"">
                                            Yêu cầu đặt lại mật khẩu
                                        </h2>
                                        <p style=""margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.6;"">
                                            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản LeafGo của bạn.
                                        </p>
                                        <p style=""margin: 0 0 25px 0; color: #666666; font-size: 16px; line-height: 1.6;"">
                                            Nhấn vào nút bên dưới để tạo mật khẩu mới:
                                        </p>
                            
                                        <!-- CTA Button -->
                                        <table role=""presentation"" style=""width: 100%; border-collapse: collapse;"">
                                            <tr>
                                                <td align=""center"" style=""padding: 20px 0;"">
                                                    <a href=""{resetUrl}"" style=""display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;"">
                                                        Đặt lại mật khẩu
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                            
                                        <!-- Warning Box -->
                                        <table role=""presentation"" style=""width: 100%; border-collapse: collapse; margin-top: 25px;"">
                                            <tr>
                                                <td style=""padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;"">
                                                    <p style=""margin: 0; color: #856404; font-size: 14px; line-height: 1.6;"">
                                                        ⚠️ <strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong vòng 1 giờ.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                            
                                        <p style=""margin: 25px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;"">
                                            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc 
                                            <a href=""mailto:support@leafgo.com"" style=""color: #667eea; text-decoration: none;"">liên hệ hỗ trợ</a> 
                                            nếu bạn có thắc mắc.
                                        </p>
                            
                                        <hr style=""margin: 25px 0; border: none; border-top: 1px solid #eeeeee;"">
                            
                                        <p style=""margin: 0; color: #999999; font-size: 13px; line-height: 1.6;"">
                                            Nếu nút không hoạt động, sao chép và dán URL sau vào trình duyệt của bạn:<br>
                                            <a href=""{resetUrl}"" style=""color: #667eea; text-decoration: none; word-break: break-all;"">{resetUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                    
                                <!-- Footer -->
                                <tr>
                                    <td style=""background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;"">
                                        <p style=""margin: 0 0 10px 0; color: #999999; font-size: 14px;"">
                                            © 2025 LeafGo. All rights reserved.
                                        </p>
                                        <p style=""margin: 0; color: #999999; font-size: 12px;"">
                                            Email này được gửi từ hệ thống tự động, vui lòng không trả lời
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>";
        }
    }
}
