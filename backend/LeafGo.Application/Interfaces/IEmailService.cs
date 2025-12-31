using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LeafGo.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string resetToken);
        Task SendWelcomeEmailAsync(string toEmail, string userName);
    }
}
