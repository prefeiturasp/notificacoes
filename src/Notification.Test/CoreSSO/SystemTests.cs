using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Notification.Business.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Tests
{
    [TestClass()]
    public class SystemTests
    {
        [TestMethod()]
        public void SystemGetTest()
        {
            Guid userId = new Guid("1538694e-12f2-e111-a89d-00155d02e702");
            Guid groupSid = new Guid("aeab580d-df16-42d5-9714-e4e581fc8134");
            //int systemId = 219;

            string json = @"[{'Id':102,'Name':' SGP','Url':'http://sgpids.mstech.com.br/SAML/Login.ashx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/iconeMenu-azul.png'},{'Id':144,'Name':' SGP - Tablet','Url':'http://10.10.10.37:5004/Admin/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/144_logoImagemMenu.png'},{'Id':175,'Name':'AVA SME-SP','Url':'http://smeportal.mstech.com.br/SAML/Login.ashx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/logo-ava.png'},{'Id':218,'Name':'Controle Financeiro de Repasses','Url':'http://ptrfids.mstech.com.br/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/218_logoImagemMenu.png'},{'Id':1,'Name':'CoreSSO','Url':'http://coressoids.mstech.com.br/AreaAdm/Login.aspx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/1_logoImagemMenu.png'},{'Id':147,'Name':'Diário do Supervisor','Url':'http://10.10.10.37:5004/Admin/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/logo-diariosupervisor.png'},{'Id':126,'Name':'Gerenciamento de Frequência','Url':'http://10.10.10.37:5004/Admin/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/logo-gfreq.png'},{'Id':104,'Name':'Gestão de Acervo','Url':'http://gestaodeacervoids.mstech.com.br/SAML/Login.ashx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/104_logoImagemMenu.png'},{'Id':219,'Name':'Notificação','Url':'http://notificacao.mstech.com.br','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/219_logoImagemMenu.png'},{'Id':302,'Name':'Permissões','Url':'http://permissoesids.mstech.com.br/SAML/Login.ashx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/logo-permissoes.png'},{'Id':215,'Name':'Plateia','Url':'http://plateiaids.mstech.com.br/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/logo-padrao.png'},{'Id':46,'Name':'Portal Interativo','Url':'http://10.10.10.37:5004/SAML/Login.ashx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/46_logoImagemMenu.png'},{'Id':142,'Name':'Quadro de horários','Url':'http://quadrodehorariosids.mstech.com.br/SAML/Login.ashx','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/142_logoImagemMenu.png'},{'Id':204,'Name':'SERAp','Url':'http://serapids.mstech.com.br/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/iconeMenu-azul.png'},{'Id':131,'Name':'Sistema de Avaliação','Url':'http://10.10.10.37:5004/Admin/Account/LoginSSO','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/logo-administrativo.png'},{'Id':207,'Name':'Tá na Rede','Url':'http://tanaredeids.mstech.com.br/Account/Index','Image':'http://coressoids.mstech.com.br/App_Themes/IntranetSME/images/logos/207_logoImagemMenu.png'}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<Entity.API.CoreSSO.System>>(json);

            var actual = SystemBusiness.Get(userId, "IntranetSME");

            IEnumerator<Entity.API.CoreSSO.System> eFixo = expected.GetEnumerator();
            IEnumerator<Entity.API.CoreSSO.System> eBanco = actual.GetEnumerator();


            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }
        }
    }
}