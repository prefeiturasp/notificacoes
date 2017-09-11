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
            
            var actual = SchoolClassificationBusiness.Get(userId, groupSid, Enumerable.Empty<Guid>());

            Assert.IsTrue(actual.Count() > 0);
        }
    }
}