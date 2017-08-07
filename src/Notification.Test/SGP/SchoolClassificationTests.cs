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
    public class SchoolClassificationTests
    {
        [TestMethod()]
        public void SchoolClassificationGetTest()
        {
            Guid userId = new Guid("1538694e-12f2-e111-a89d-00155d02e702");
            Guid groupSid = new Guid("aeab580d-df16-42d5-9714-e4e581fc8134");

            string json = @"[{'Id':1,'Name':'CEI'},{'Id':2,'Name':'CEMEI'},{'Id':6,'Name':'CEU EMEF'},{'Id':7,'Name':'CIEJA'},{'Id':8,'Name':'EMEBS'},{'Id':4,'Name':'EMEF'},{'Id':5,'Name':'EMEFM'},{'Id':3,'Name':'EMEI'}]";
            var expected = JsonConvert.DeserializeObject<IEnumerable<SchoolClassification>>(json);

            var actual = SchoolClassificationBusiness.Get(userId, groupSid, Enumerable.Empty<Guid>());

            IEnumerator<SchoolClassification> eFixo = expected.GetEnumerator();
            IEnumerator<SchoolClassification> eBanco = actual.GetEnumerator();

            Assert.AreEqual(expected.Count(), actual.Count());
            while (eFixo.MoveNext() && eBanco.MoveNext())
            {
                Assert.AreEqual(eFixo.Current.Id, eBanco.Current.Id);
            }
        }
    }
}