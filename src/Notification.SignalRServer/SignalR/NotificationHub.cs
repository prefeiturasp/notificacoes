﻿using System;
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
            try
            {
                LogBusiness.Info(string.Format("[NotificationHub] OnConnected (connectionId: {0})", Context.ConnectionId));

                var principal = this.Context.User as ClaimsPrincipal;

                var getUserId = from c in principal.Identities.First().Claims
                                where c.Type == CLAIM_USERID
                                select c.Value;//.FirstOrDefault(); 
                var userId = getUserId.FirstOrDefault();

                if (userId != null)
                {
                    LogBusiness.Debug(string.Format("[NotificationHub] Grupo ({0})  criado (connectionId: {1})", userId, Context.ConnectionId));
                    Groups.Add(Context.ConnectionId, userId);
                }

                return base.OnConnected();
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
                throw;
            }
        }

        public override Task OnReconnected()
        {
            try
            {
                LogBusiness.Info(string.Format("[NotificationHub] OnReconnected (connectionId: {0})", Context.ConnectionId));
                return base.OnReconnected();
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
                throw;
            }
}

        public override Task OnDisconnected(bool stopCalled)
        {
            try
            {
                LogBusiness.Info(string.Format("[NotificationHub] OnDisconnected (connectionId: {0})", Context.ConnectionId));

                var principal = this.Context.User as ClaimsPrincipal;

                var getUserId = from c in principal.Identities.First().Claims
                                where c.Type == CLAIM_USERID
                                select c.Value;//.FirstOrDefault(); 
                var userId = getUserId.FirstOrDefault();

                if (userId != null)
                {
                    LogBusiness.Debug(string.Format("[NotificationHub] Grupo ({0})  removido (connectionId: {1})", userId, Context.ConnectionId));
                    Groups.Remove(Context.ConnectionId, userId.ToString());
                }

                return base.OnDisconnected(stopCalled);
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
                throw;
            }
        }
        
        public void SendNotification(IEnumerable<Guid> users, Notification.Entity.SignalR.Notification notification)
        {
            try
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

                foreach (var user in users)
                {
                    LogBusiness.Debug(string.Format("[NotificationHub] SendNotification  - Notificação ({0}) enviada para o usuário ({1})", notification.Id, user));
                    Clients.Group(user.ToString()).ReceiveNotification(notification);
                }
            }
            catch (Exception exc)
            {
                LogBusiness.Error(exc);
                throw;
            }
        }
    }
}