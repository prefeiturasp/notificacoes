
namespace Notification.Repository.Connections
{
    public abstract class CoreSSORepository
    {
        internal readonly string stringConnection;

        public CoreSSORepository()
        {
            stringConnection = Connection.Get("CoreSSO");
        }
    }
}
