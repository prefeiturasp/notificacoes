using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Notification.Business;
using System.Security.Claims;

namespace Notification.SignalRServer.SignalR
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private const string CLAIM_USERID = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

        public override Task OnConnected()
        {
            LogBusiness.Info(string.Format("[NotificationHub] OnConnected (connectionId: {0})", Context.ConnectionId));

            var principal = this.Context.User as ClaimsPrincipal;

            var getUserId = from c in principal.Identities.First().Claims
                            where c.Type == CLAIM_USERID
                            select c.Value;//.FirstOrDefault(); 
            var userId = getUserId.FirstOrDefault();

            if (userId != null)
                Groups.Add(Context.ConnectionId, userId);

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

            var principal = this.Context.User as ClaimsPrincipal;

            var getUserId = from c in principal.Identities.First().Claims
                            where c.Type == CLAIM_USERID
                            select c.Value;//.FirstOrDefault(); 
            var userId = getUserId.FirstOrDefault();

            if (userId != null)
                Groups.Remove(Context.ConnectionId, userId.ToString());

            return base.OnDisconnected(stopCalled);
        }
        
        public void SendNotification(IEnumerable<Guid> users, Notification.Entity.SignalR.Notification notification)
        {
            LogBusiness.Info(string.Format("[NotificationHub] SendNotification (connectionId: {0})", Context.ConnectionId));

            var u = new List<Guid>();
            u.Add(new Guid("7fc07b9d-c130-e111-9b36-00155d033206"));

            Parallel.ForEach(u, user =>
            {
                Clients.Group(user.ToString()).ReceiveNotification(notification);
            });

        }
    }
}