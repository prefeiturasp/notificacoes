using Hangfire;
using Microsoft.AspNet.SignalR.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.Signal
{
    public class SignalRClientBusiness
    {
        public const string CONFIG_URLSIGNALRSERVERHUB = "UrlSignalRServerHub";
        public const string CONFIG_USERCREDENTIALSIGNALRSERVER = "UserCredentialSignalRServer";
        public const string CONFIG_PASSWORDCREDENTIALSIGNALRSERVER = "PasswordCredentialSignalRServer";

        public static string UrlSignalRServer = string.Empty;
        public static string UserCredentialSignalRServer = string.Empty;
        public static string PasswordCredentialSignalRServer = string.Empty;

        public static void SendNotificationHangFire(IEnumerable<Guid> users, Guid notificationId)
        {
            BackgroundJob.Enqueue(() => SendNotification(users, notificationId));
        }

        public static void SendNotificationHangFire(DateTime delayDate, Guid userId, Guid notificationId)
        {
            var users = new List<Guid>();
            users.Add(userId);

            BackgroundJob.Schedule(() => SendNotification(users, notificationId), delayDate);
        }

        public static void SendNotification(IEnumerable<Guid> users, Guid notificationId)
        {
            try
            {
                var notif = NotificationBusiness.GetById(notificationId);

                if (notif == null)
                {
                    LogBusiness.Warn(string.Format("[SignalRClientBusiness] SendNotification - Notificação não encontrada ({0})", notificationId));
                    return;
                }
                
                if ((notif.DateStartNotification > DateTime.Now.Date)
                    || (notif.DateEndNotification != null && DateTime.Now.Date > notif.DateEndNotification))
                {
                    LogBusiness.Info(string.Format("[SignalRClientBusiness] SendNotification - Notificação fora do período programado ({0})", notificationId));
                    return;
                }
                
                var notifP = new Notification.Entity.SignalR.Notification()
                {
                    Id = notif.Id,
                    Title = notif.Title,
                    Message = notif.Message
                };

                var hubConnection = new HubConnection(UrlSignalRServer);
                var hub = hubConnection.CreateHubProxy("notificationHub");

                hubConnection.Headers.Add("Authorization", "Basic " + Base64Encode(UserCredentialSignalRServer, PasswordCredentialSignalRServer));

                hubConnection.Start().Wait();

                int i = 0;
                int total = users.Count();

                while (i < total)
                {
                    var ltU = users.Skip(i).Take(1000).ToList();
                    LogBusiness.Debug(string.Format("[SignalRClientBusiness] SendNotification - Enviando... ({0}-{1})", i, ltU.Count));
                    hub.Invoke("SendNotification", ltU, notifP).Wait();
                    i += 1000;
                }

                hubConnection.Stop();
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
                throw;
            }
        }

        private static string Base64Encode(string user, string password)
        {
            var str = string.Format("{0}:{1}", user, password);
            var plainTextBytes = System.Text.Encoding.ASCII.GetBytes(str);
            return System.Convert.ToBase64String(plainTextBytes);
        }
    }
}
