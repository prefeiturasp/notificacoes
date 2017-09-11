using Notification.Entity.API.CoreSSO;
using Notification.Repository.CoreSSO;
using System;


namespace Notification.Business.CoreSSO
{
    public class UserBusiness
    {
        /// <summary>
        /// Busca o usuário (nome e id) solicitado no parâmetro
        /// Para ser exibido o nome do usuário logado no cabeçalho da página, por exemplo.
        /// </summary>
        /// <param name="userId">Id do usuário</param>
        /// <returns></returns>
        public static User Get(Guid userId)
        {
            var repository = new UserRepository();
            return repository.Get(userId);
        }
    }
}
