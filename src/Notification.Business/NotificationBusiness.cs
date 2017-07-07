using Notification.Business.Exceptions;
using Notification.Business.SGP;
using Notification.Business.Signal;
using Notification.Entity.API;
using Notification.Repository;
using Notification.Repository.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business
{
    public class NotificationBusiness
    {
        private static Guid Save(Notification.Entity.API.Notification entity, IEnumerable<Guid> users)
        {
            var entityNotification = new Notification.Entity.Database.Notification()
            {
                SenderId = Guid.Empty,
                SenderName = entity.SenderName,
                DateStartNotification = entity.DateStartNotification.Date,
                DateEndNotification = entity.DateEndNotification,
                MessageType = entity.MessageType,
                Title = entity.Title,
                Message = entity.Message,
                Recipient = users.Select(u => new Entity.Database.NotificationRecipient() { UserId = u })
            };

            var notRep = new NotificationRepository();
            var Id = notRep.InsertOne(entityNotification);

            if (Id != Guid.Empty)
                SignalRClientBusiness.SendNotificationHangFire(entityNotification.Recipient.Select(r => r.UserId), Id);

            return Id;
        }

        /// <summary>
        /// Envia a notificação para os usuários baseados nos filtros e nas permissões do usuário logado
        /// </summary>
        /// <param name="userId">Id do usuário logado</param>
        /// <param name="groupId">Id do gruopo logado</param>
        /// <param name="entity"></param>
        /// <returns></returns>
        public static Guid Save(Guid userId, Guid groupId, Notification.Entity.API.Notification entity)
        {
            if (entity.Recipient == null)
                throw new NotificationRecipientIsEmptyException();

            if ((entity.Recipient.SystemRecipient == null || !entity.Recipient.SystemRecipient.Any())
                && (entity.Recipient.ContributorRecipient == null || !entity.Recipient.ContributorRecipient.Any())
                && (entity.Recipient.TeacherRecipient == null || !entity.Recipient.TeacherRecipient.Any()))
                throw new NotificationRecipientIsEmptyException();
            
            var groupRep = new GroupRepository();
            var userRep = new UserRepository();
            var groupUser = groupRep.GetById(groupId);
            var ltUser = new List<Guid>();

            if (entity.Recipient.SystemRecipient != null)
            {
                foreach (var item in entity.Recipient.SystemRecipient)
                {
                    //pendente de testes
                    if (groupUser.VisionId > 1)
                    {
                        //se não passar Escola, buscar todas as escolas das DRE's selecionadas, e/ou todas que o usuário logado tenha permissão (mesmo se a listagem vier nula)
                        if (! item.AdministrativeUnit.Any())
                        {
                            item.AdministrativeUnit = SchoolBusiness.GetAUBySuperior(userId, groupId, item.AdministrativeUnitSuperior);
                        }
                        ltUser.AddRange(userRep.GetByVisionAll(userId, groupId, item.SystemId, item.GroupId, item.AdministrativeUnitSuperior, item.AdministrativeUnit).Select(u => u.Id));
                    }

                    else if ((item.AdministrativeUnit != null && item.AdministrativeUnit.Any())
                        || (item.AdministrativeUnitSuperior != null && item.AdministrativeUnitSuperior.Any()))
                    {
                        if (groupUser.VisionId == 1)
                            if (item.AdministrativeUnit != null && item.AdministrativeUnit.Any())
                                ltUser.AddRange(userRep.GetByVisionAdministrator(userId, item.SystemId.First(), item.GroupId.First(), item.AdministrativeUnit).Select(u => u.Id));
                            else
                                ltUser.AddRange(userRep.GetByVisionAdministrator(userId, item.SystemId.First(), item.GroupId.First(), item.AdministrativeUnitSuperior).Select(u => u.Id));
                    }
                    else if (item.GroupId != null && item.GroupId.Any())
                    {
                        if (groupUser.VisionId == 1)
                            ltUser.AddRange(userRep.GetByVisionAdministrator(userId, item.SystemId.First(), item.GroupId).Select(u => u.Id));
                    }
                    else
                    {
                        if (groupUser.VisionId == 1)
                            ltUser.AddRange(userRep.GetByVisionAdministrator(userId, item.SystemId).Select(u => u.Id));
                    }
                }
            }

            if (entity.Recipient.ContributorRecipient != null)
            {
                foreach (var item in entity.Recipient.ContributorRecipient)
                {
                    ltUser.AddRange(ContributorBusiness.Get(userId, groupId, null, item.SchoolSuperior, item.SchoolClassification, item.School, item.Position).Select(u => u.Id));
                }
            }

            if (entity.Recipient.TeacherRecipient != null)
            {
                foreach (var item in entity.Recipient.TeacherRecipient)
                {
                    ltUser.AddRange(TeacherBusiness.Get(userId, groupId, null, item.SchoolSuperior, item.SchoolClassification, item.School, item.Position, item.Course, item.CoursePeriod, item.Discipline, item.Team).Select(u => u.Id));
                }
            }

            if (ltUser.Any())
            {
                ltUser = ltUser.Distinct().ToList();
                                
                return Save(entity, ltUser);
            }
            else
                throw new NotificationWithoutRecipientException();
        }

        /// <summary>
        /// Envia a notificação para a lista de usuários informada
        /// </summary>
        /// <param name="entity"></param>
        /// <returns></returns>
        public static Guid Save(Notification.Entity.API.Notification entity)
        {
            if (entity.Recipient == null)
                throw new NotificationRecipientIsEmptyException();

            if ((entity.Recipient.UserRecipient == null || !entity.Recipient.UserRecipient.Any()))
                throw new NotificationRecipientIsEmptyException();
            
            var ltUser = new List<Guid>();

            if (entity.Recipient.UserRecipient != null)
            {
                ltUser.AddRange(entity.Recipient.UserRecipient);
            }

            if (ltUser.Any())
            {
                ltUser = ltUser.Distinct().ToList();
                
                return Save(entity, ltUser);
            }
            else
                throw new NotificationWithoutRecipientException();
        }

        public static NotificationPlugin GetById(Guid id)
        {
            var repository = new NotificationRepository();
            return repository.GetById(id);
        }

        public static IEnumerable<NotificationPlugin> GetNotReadByUserId(Guid userId, int page, int size)
        {
            var repository = new NotificationRepository();
            return repository.GetNotReadByUserId(userId, page, size);
        }

        public static IEnumerable<NotificationPlugin> GetReadByUserId(Guid userId, int page, int size)
        {
            var repository = new NotificationRepository();
            return repository.GetReadByUserId(userId, page, size);
        }

        public static void Action(Guid userId, NotificationAction entity)
        {
            var repository = new NotificationRepository();

            if (entity.DelayId.HasValue)
            {
                var date = DateTime.Now.AddMinutes(DelayTimeBusiness.GetTimeById(entity.DelayId.Value));
                repository.UpdateDelayDate(entity.NotificationId, userId, date);
                Signal.SignalRClientBusiness.SendNotificationHangFire(date, userId, entity.NotificationId);
            }
            else if (entity.Read.HasValue)
            {
                repository.UpdateRead(entity.NotificationId, userId, entity.Read.Value);
            }
        }
    }
}
