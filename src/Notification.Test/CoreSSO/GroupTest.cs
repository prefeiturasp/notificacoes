using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Notification.Business.CoreSSO;
using Notification.Entity.API.CoreSSO;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Notification.Tests
{
    [TestClass()]
    public class GroupTest
    {
        [TestMethod()]
        public void GroupGetGroupDownTest()
        {
            Guid userId = new Guid("1538694e-12f2-e111-a89d-00155d02e702");
            Guid groupSid = new Guid("aeab580d-df16-42d5-9714-e4e581fc8134");
            int systemId = 102;

            string json = @"[{'Id':'d82a2c9d-3c13-e411-a91a-782bcb3d218e','Name':'Administrador do SGP na DRE','VisionId':2,'SystemId':102},{'Id':'59bd1553-cda6-e311-b1fe-782bcb3d2d76','Name':'Administrador do SGP na UE','VisionId':3,'SystemId':102},{'Id':'84d6ec99-af8a-e311-b1fe-782bcb3d2d76','Name':'Administrador do sistema gestão pedagógica','VisionId':1,'SystemId':102},{'Id':'85a1df73-9dc5-e311-b1fe-782bcb3d2d76','Name':'Assistente de Diretor na UE','VisionId':3,'SystemId':102},{'Id':'3ec44693-92af-e311-b1fe-782bcb3d2d76','Name':'Coordenador Pedagógico','VisionId':3,'SystemId':102},{'Id':'cff10973-d69c-e411-9c5c-782bcb3d218e','Name':'Digitação do fechamento 2014','VisionId':1,'SystemId':102},{'Id':'077b5042-a9b6-e311-b1fe-782bcb3d2d76','Name':'Diretor Escolar','VisionId':3,'SystemId':102},{'Id':'ea7ec579-b006-479e-bca6-4a7bebb5412e','Name':'Diretor Escolar Infantil Terceirizada','VisionId':3,'SystemId':102},{'Id':'8d32e519-c55e-e411-819d-782bcb3d218e','Name':'Diretor Regional','VisionId':2,'SystemId':102},{'Id':'85d6ec99-af8a-e311-b1fe-782bcb3d2d76','Name':'Docente','VisionId':4,'SystemId':102},{'Id':'7a5911d2-49bf-e311-b1fe-782bcb3d2d76','Name':'Docente - CJ e outros','VisionId':4,'SystemId':102},{'Id':'a9635c70-0e6c-4c3a-93f4-a901c65f106b','Name':'Docente - CJ e outros terceirizado','VisionId':4,'SystemId':102},{'Id':'14d9ecd8-affc-e511-8134-782bcb3d218e','Name':'Gestão SGP - Leitura','VisionId':1,'SystemId':102},{'Id':'8e49d1fe-326b-e411-819d-782bcb3d218e','Name':'Secretário Escolar','VisionId':3,'SystemId':102},{'Id':'cacc8667-eb64-494d-b31a-88fd1e2c3904','Name':'Secretário Escolar Infantil','VisionId':3,'SystemId':102},{'Id':'3ee28335-163a-4d2b-9a4a-9b9f09ee01a6','Name':'Secretário Escolar Infantil Terceirizado','VisionId':3,'SystemId':102},{'Id':'16d16786-a4e8-e611-9541-782bcb3d218e','Name':'SGP Suporte GeP','VisionId':1,'SystemId':102},{'Id':'964ff066-499f-e511-922d-782bcb3d218e','Name':'SME - Adm COPED','VisionId':1,'SystemId':102},{'Id':'a08a8ed1-5242-e411-819d-782bcb3d218e','Name':'Supervisor escolar','VisionId':2,'SystemId':102},{'Id':'7a795fc0-5242-e411-819d-782bcb3d218e','Name':'Supervisor Tecnico ','VisionId':2,'SystemId':102},{'Id':'d1a1c877-47a2-e411-922d-782bcb3d218e','Name':'Técnico','VisionId':2,'SystemId':102}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<Group>>(json);

            var actual = GroupBusiness.GetGroupDown(userId, systemId, groupSid);

            IEnumerator<Group> eFixo = expected.GetEnumerator();
            IEnumerator<Group> eBanco = actual.GetEnumerator();


            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }
        }

        [TestMethod()]
        public void GroupGetTest()
        {
            Guid userId = new Guid("1538694e-12f2-e111-a89d-00155d02e702");
            int systemId = 219;

            string json = @"[{'Id':'aeab580d-df16-42d5-9714-e4e581fc8134','Name':'Administrador Notificação','VisionId':1,'SystemId':219},{'Id':'23890515-6a57-e711-80c7-00155d000d29','Name':'Gestor notificação','VisionId':2,'SystemId':219},{'Id':'1a70f823-6a57-e711-80c7-00155d000d29','Name':'Unidade Administrativa Notificação','VisionId':3,'SystemId':219}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<Group>>(json);

            var actual = GroupBusiness.Get(userId, systemId);

            IEnumerator<Group> eFixo = expected.GetEnumerator();
            IEnumerator<Group> eBanco = actual.GetEnumerator();


            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }

        }
    }
}