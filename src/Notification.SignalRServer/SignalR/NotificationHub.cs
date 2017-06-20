using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Notification.Business;

namespace Notification.SignalRServer.SignalR
{
    public class NotificationHub : Hub
    {
        public override Task OnConnected()
        {
            LogBusiness.Info(string.Format("[NotificationHub] OnConnected (connectionId: {0})", Context.ConnectionId));
            return base.OnConnected();
        }

        public override Task OnReconnected()
        {
            LogBusiness.Info(string.Format("[NotificationHub] OnReconnected (connectionId: {0})", Context.ConnectionId));
            return base.OnReconnected();
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            LogBusiness.Info(string.Format("[NotificationHub] OnDisconnected (connectionId: {0})", Context.ConnectionId));
            return base.OnDisconnected(stopCalled);
        }
        
        public void SendNotification(IEnumerable<Guid> users, Notification.Entity.SignalR.Notification notification)
        {
            LogBusiness.Info(string.Format("[NotificationHub] SendNotification (connectionId: {0})", Context.ConnectionId));
            Clients.All.ReceiveNotification(notification);
        }
    }
}