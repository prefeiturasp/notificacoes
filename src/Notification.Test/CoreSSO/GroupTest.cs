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

            var actual = GroupBusiness.GetGroupDown(userId, systemId, groupSid);

            Assert.IsTrue(actual.Count() > 0);
        }

        [TestMethod()]
        public void GroupGetTest()
        {
            Guid userId = new Guid("1538694e-12f2-e111-a89d-00155d02e702");
            int systemId = 219;

            var actual = GroupBusiness.Get(userId, systemId);

            Assert.IsTrue(actual.Count() > 0);

        }
    }
}