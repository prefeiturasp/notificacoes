using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using Notification.Business.SGP;
using Notification.Entity.API.SGP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Tests
{
    [TestClass()]
    public class DisciplineTests
    {
        [TestMethod()]
        public void DisciplineGetTest()
        {
            string json = @"[{'Id':4,'Name':'Arte - Ensino Fundamental'},{'Id':17,'Name':'Arte - Ensino Médio'},{'Id':130,'Name':'Atendimento educacional especializado - Ensino Fundamental'},{'Id':22,'Name':'Biologia - Ensino Médio'},{'Id':7,'Name':'Ciências - Ensino Fundamental'},{'Id':123,'Name':'Conceito Global (Berçario/Minigrupo) - Educação Infantil'},{'Id':124,'Name':'Conceito Global (Infantil I e II) - Educação Infantil'},{'Id':32,'Name':'Docência Compartilhada - Ensino Fundamental'},{'Id':5,'Name':'Educação física - Ensino Fundamental'},{'Id':18,'Name':'Educação física - Ensino Médio'},{'Id':26,'Name':'Filosofia - Ensino Médio'},{'Id':20,'Name':'Física - Ensino Médio'},{'Id':8,'Name':'Geografia - Ensino Fundamental'},{'Id':24,'Name':'Geografia - Ensino Médio'},{'Id':9,'Name':'História - Ensino Fundamental'},{'Id':23,'Name':'História - Ensino Médio'},{'Id':12,'Name':'Informática educativa - Ensino Fundamental'},{'Id':14,'Name':'Libras - Ensino Fundamental'},{'Id':30,'Name':'Libras compartilhada - Ensino Fundamental'},{'Id':29,'Name':'Língua espanhola - Ensino Médio'},{'Id':10,'Name':'Língua inglesa - Ensino Fundamental'},{'Id':25,'Name':'Língua inglesa - Ensino Médio'},{'Id':3,'Name':'Língua portuguesa - Ensino Fundamental'},{'Id':16,'Name':'Língua portuguesa - Ensino Médio'},{'Id':6,'Name':'Matemática - Ensino Fundamental'},{'Id':19,'Name':'Matemática - Ensino Médio'},{'Id':13,'Name':'Projetos - Ensino Fundamental'},{'Id':21,'Name':'Química - Ensino Médio'},{'Id':131,'Name':'Recuperação paralela - Ciências - Ensino Fundamental'},{'Id':133,'Name':'Recuperação paralela - História - Ensino Fundamental'},{'Id':134,'Name':'Recuperação paralela - Matemática - Ensino Fundamental'},{'Id':135,'Name':'Recuperação paralela - Português - Ensino Fundamental'},{'Id':15,'Name':'Regência de classe - Ensino Fundamental'},{'Id':11,'Name':'Sala de leitura - Ensino Fundamental'},{'Id':27,'Name':'Sociologia - Ensino Médio'},{'Id':33,'Name':'Territ. Saber / Exp. Pedag 1 - Ensino Fundamental'},{'Id':42,'Name':'Territ. Saber / Exp. Pedag 10 - Ensino Fundamental'},{'Id':34,'Name':'Territ. Saber / Exp. Pedag 2 - Ensino Fundamental'},{'Id':35,'Name':'Territ. Saber / Exp. Pedag 3 - Ensino Fundamental'},{'Id':36,'Name':'Territ. Saber / Exp. Pedag 4 - Ensino Fundamental'},{'Id':37,'Name':'Territ. Saber / Exp. Pedag 5 - Ensino Fundamental'},{'Id':38,'Name':'Territ. Saber / Exp. Pedag 6 - Ensino Fundamental'},{'Id':39,'Name':'Territ. Saber / Exp. Pedag 7 - Ensino Fundamental'},{'Id':40,'Name':'Territ. Saber / Exp. Pedag 8 - Ensino Fundamental'},{'Id':41,'Name':'Territ. Saber / Exp. Pedag 9 - Ensino Fundamental'}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<Discipline>>(json);

            var actual = DisciplineBusiness.Get("2017", Enumerable.Empty<int>(), Enumerable.Empty<string>());

            IEnumerator<Discipline> eFixo = expected.GetEnumerator();
            IEnumerator<Discipline> eBanco = actual.GetEnumerator();

            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }
        }
    }
}