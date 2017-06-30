using Notification.Business.SGP;
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
        public static Guid Save(Guid userId, Guid groupId, Notification.Entity.API.Notification entity)
        {
            if (entity.Recipient == null)
                throw new Exception();

            if ((entity.Recipient.SystemRecipient != null && !entity.Recipient.SystemRecipient.Any())
                || (entity.Recipient.ContributorRecipient != null && !entity.Recipient.ContributorRecipient.Any())
                || (entity.Recipient.TeacherRecipient != null && !entity.Recipient.TeacherRecipient.Any()))
                throw new Exception();
            
            var groupRep = new GroupRepository();
            var userRep = new UserRepository();
            var groupUser = groupRep.GetById(groupId);
            var ltUser = new List<Guid>();

            foreach (var item in entity.Recipient.SystemRecipient)
            {
                if ((item.AdministrativeUnit != null && item.AdministrativeUnit.Any())
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

            foreach (var item in entity.Recipient.ContributorRecipient)
            {
                ltUser.AddRange(ContributorBusiness.Get(userId, groupId, null, item.SchoolSuperior, item.SchoolClassification, item.School, item.Position).Select(u => u.Id));
            }

            foreach (var item in entity.Recipient.TeacherRecipient)
            {
                ltUser.AddRange(TeacherBusiness.Get(userId, groupId, null, item.SchoolSuperior, item.SchoolClassification, item.School, item.Position, item.Course, item.CoursePeriod, item.Discipline, item.Team).Select(u => u.Id));
            }

            if (ltUser.Count() > 0)
            {
                ltUser = ltUser.Distinct().ToList();

                var entityNotification = new Notification.Entity.Database.Notification()
                {
                    SenderId = userId,
                    SenderName = entity.SenderName,
                    DateStartNotification = entity.DateStartNotification,
                    DateEndNotification = entity.DateEndNotification,
                    MessageType = entity.MessageType,
                    Title = entity.Title,
                    Message = entity.Message,
                    Recipient = ltUser.Select(u => new Entity.Database.NotificationRecipient() { UserId = u })
                };

                var notRep = new NotificationRepository();
                var Id = notRep.InsertOne(entityNotification);

                //SignalRClientBusiness.SendNotificationHangFire

                return Id;
            }
            else
                return Guid.Empty;
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
                //TODO: Configrar a data a ser gravada
                repository.UpdateDelayDate(entity.NotificationId, userId, new DateTime());
            }
            else if (entity.Read.HasValue)
            {
                repository.UpdateRead(entity.NotificationId, userId, entity.Read.Value);
            }
        }
    }
}
