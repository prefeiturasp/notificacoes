﻿using Notification.API.Areas.v1;
using Notification.API.Models;
using Notification.Business;
using Notification.Business.CoreSSO;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Principal;
using System.Threading;
using System.Web;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Cors;
using System.Web.Http.Description;

namespace Notification.API.Areas.CoreSSO.v1
{
    public class GroupController : AuthUserGroupBaseController
    {
        private const string CHAVE_ID_SISTEMA = "SystemID";

        /// <summary>
        /// Retorna todos os grupos cuja visão seja menor ou igual à que o usuário logado escolheu.
        /// Enviar o id do grupo que usuário logado escolheu na entrada do sistema (groupSid) no header.
        /// </summary>
        /// <param name="systemId">ID do sistema selecionado para receber a notificação</param>
        /// <returns></returns>
        [HttpGet]
        [Route("api/CoreSSO/v1/GroupDown")]
        [ResponseType(typeof(IEnumerable<Group>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage Get(int systemId)
        {
            try
            {
                var result = GroupBusiness.GetGroupDown(claimData.UserId, systemId, claimData.GroupId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
            }
        }

        /// <summary>
        /// Busca todos os grupos do usuário logado que pertença ao sistema de Notificações.
        /// Depois de escolher 1 grupo, será necessário mandar o ID do mesmo no Header (groupSid)
        /// Obs: Na chamada deste método, passar groupSid = '00000000-0000-0000-0000-000000000000' no Header
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("api/CoreSSO/v1/Group")]
        [ResponseType(typeof(IEnumerable<Group>))]
        [EnableCors("*", "*", "*", "*")]
        public HttpResponseMessage GetAll()
        {
            try
            {
                int systemId = Convert.ToInt32(ConfigurationManager.AppSettings[CHAVE_ID_SISTEMA]);

                var result = GroupBusiness.Get(claimData.UserId, systemId);
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception exc)
            {
                var logId = LogBusiness.Error(exc);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, new ErrorModel(logId));
            }
        }

        ///// <summary>
        ///// Insere o ID do grupo no Claims para o usuário logado. (como o dado não persiste, necessita de mais estudos para usar o BD)
        ///// </summary>
        ///// <param name="groupId"></param>
        ///// <returns></returns>
        //[HttpPost]
        //[Route("api/CoreSSO/v1/Group")]
        //[ResponseType(typeof(Group))]
        //public HttpResponseMessage Post(Group group)
        //{
        //    try
        //    {
        //        //string urlIdentityServer = ConfigurationManager.AppSettings[CHAVE_ID_SISTEMA];

        //        ClaimsPrincipal principal = Request.GetRequestContext().Principal as ClaimsPrincipal;
        //        //principal.Identities.First().AddClaim(new Claim(ClaimTypes.GroupSid, group.Id.ToString()));

        //        //claimData.Gru_id = groupId;

              

        //        System.Web.HttpContext.Current.User.Identity.AddGrupoId(System.Web.HttpContext.Current.Request, group.Id.ToString());



        //        var result = group.Id;
        //        return Request.CreateResponse(HttpStatusCode.OK, result);
        //    }
        //    catch (Exception exc)
        //    {
        //        var logId = LogBusiness.Error(exc);
        //        return Request.CreateResponse(HttpStatusCode.InternalServerError, logId);
        //    }
        //}

      
    }
}
