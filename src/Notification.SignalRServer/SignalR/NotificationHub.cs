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
            {
                LogBusiness.Debug(string.Format("[NotificationHub] Grupo ({0})  criado (connectionId: {0})", userId));
                Groups.Add(Context.ConnectionId, userId);
            }                

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
            {
                LogBusiness.Debug(string.Format("[NotificationHub] Grupo ({0})  removido (connectionId: {0})", userId));
                Groups.Remove(Context.ConnectionId, userId.ToString());
            }

            return base.OnDisconnected(stopCalled);
        }
        
        public void SendNotification(IEnumerable<Guid> users, Notification.Entity.SignalR.Notification notification)
        {
            LogBusiness.Info(string.Format("[NotificationHub] SendNotification (connectionId: {0})", Context.ConnectionId));

            if (users == null || !users.Any())
            {
                LogBusiness.Warn(string.Format("[NotificationHub] SendNotification  - Listagem de usuários vazia (connectionId: {0})", Context.ConnectionId));
                return;
            }

            if (notification == null)
            {
                LogBusiness.Warn(string.Format("[NotificationHub] SendNotification  - Notificação vazia (connectionId: {0})", Context.ConnectionId));
                return;
            }

            Parallel.ForEach(users, user =>
            {
                LogBusiness.Debug(string.Format("[NotificationHub] SendNotification  - Notificação ({0}) enviada para o usuário ({1})", notification.Id, user));
                Clients.Group(user.ToString()).ReceiveNotification(notification);
            });
        }
    }
}