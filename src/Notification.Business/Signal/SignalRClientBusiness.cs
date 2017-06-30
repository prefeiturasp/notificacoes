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

        public static string UrlSignalRServer = string.Empty;

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
            var notif = NotificationBusiness.GetById(notificationId);
            var notifP = new Notification.Entity.SignalR.Notification()
            {
                Id = notif.Id,
                Title = notif.Title,
                Message = notif.Message
            };

            var hubConnection = new HubConnection(UrlSignalRServer);
            var hub = hubConnection.CreateHubProxy("notificationHub");

            hubConnection.Start().Wait();
            hub.Invoke("SendNotification", users, notifP);
            hubConnection.Stop();
        }
    }
}
