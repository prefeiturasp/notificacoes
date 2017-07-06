using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Business.Exceptions
{
    public class NotificationWithoutRecipientException : Exception
    {
        public NotificationWithoutRecipientException() :
            base("Notificação não foi associada a nenhum usuário.")
        { }
    }

    public class NotificationRecipientIsEmptyException : Exception
    {
        public NotificationRecipientIsEmptyException() :
            base("A lista de destinatários da notificação está vazia.")
        { }
    }
}
